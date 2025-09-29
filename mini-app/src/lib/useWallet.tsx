
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

import init, {
    BindingLiquidSdk,
    connect,
    defaultConfig,
} from '@breeztech/breez-sdk-liquid/web'

export type WalletContextType = {
    walletExists: boolean;
    promptForPassword: boolean;
    decryptWallet: (password: string) => Promise<boolean>;
    breezSdk: BindingLiquidSdk | undefined;
    storeWallet: (password: string) => Promise<void>
    bolt12Destination: string | null
    btcAddress: string | null,
    bitcoinLimits: Limit,
    lightningLimits: Limit
};

const WalletContext = createContext<WalletContextType | undefined>(undefined);

const WALLET_KEY = 'wallet_cipher'
const WALLET_UNLOCK_LAST_DATE = 'wallet_unlock_last_date'
const WALLET_BOLT12_DESTINATION = 'wallet_bolt12_destination'
const WALLET_BTC_ADDRESS = 'wallet_btc_address'

const SESSION_MNEMONIC_KEY = 'wallet_session_mnemonic'
const SESSION_BTC_LIMITS = 'btc_limits'
const SESSION_LIGHTNING_LIMITS = 'lightning_limits'
const SESSION_LIMITS_LAST_DATE = 'limits_last_date'


const INACTIVITY_SPAN_MS = 10 * 60 * 1000; // 10 minutes
const LIMITS_REFRESH_SPAN_MS = 5 * 60 * 1000 // 5 minutes

async function decrypt(cipher: string, password: string): Promise<string | null> {
    // Decrypt using AES-GCM with PBKDF2-derived key
    try {
        const { cipher: cipherArr, iv: ivArr, salt: saltArr } = JSON.parse(cipher);
        const enc = new TextEncoder();
        const keyMaterial = await window.crypto.subtle.importKey(
            "raw",
            enc.encode(password),
            "PBKDF2",
            false,
            ["deriveBits", "deriveKey"],
        );
        const key = await window.crypto.subtle.deriveKey(
            {
                name: "PBKDF2",
                salt: new Uint8Array(saltArr),
                iterations: 100000,
                hash: "SHA-256",
            },
            keyMaterial,
            { name: "AES-GCM", length: 256 },
            true,
            ["encrypt", "decrypt"],
        )
        const decrypted = await window.crypto.subtle.decrypt(
            {
                name: "AES-GCM",
                iv: new Uint8Array(ivArr),
            },
            key,
            new Uint8Array(cipherArr)
        )
        return new TextDecoder().decode(decrypted)
    } catch {
        return null;
    }
}

const requireUnlock = () => {
    const lastUnlockDate = localStorage.getItem(WALLET_UNLOCK_LAST_DATE) 
    return lastUnlockDate ? Date.now() - parseInt(lastUnlockDate) > INACTIVITY_SPAN_MS : true
}

const requiredReloadLimits = () => {
    return sessionStorage.getItem(SESSION_LIMITS_LAST_DATE)
        ? Date.now() - parseInt(sessionStorage.getItem(SESSION_LIMITS_LAST_DATE) as string) > LIMITS_REFRESH_SPAN_MS
        : false
}

type Limit = {
    min: number
    max: number
}

const storePreloadedLimits = async (sdk: BindingLiquidSdk) => {
    const { bitcoin, lightning} = await preloadLimits(sdk)
    sessionStorage.setItem(SESSION_BTC_LIMITS, JSON.stringify(bitcoin))
    sessionStorage.setItem(SESSION_LIGHTNING_LIMITS, JSON.stringify(lightning))
    sessionStorage.setItem(SESSION_LIMITS_LAST_DATE, Date.now().toString())
    return {bitcoin, lightning}
}

export const WalletProvider = ({children}: {children: ReactNode}) => {
    const cipher = localStorage.getItem(WALLET_KEY)

    const [walletExists, setWalletExists] = useState(!!cipher);
    const [promptForPassword, setPromptForPassword] = useState(!!cipher && requireUnlock());
    const [breezSdk, setBreezSdk] = useState<BindingLiquidSdk | undefined>(undefined);
    const [bolt12Destination, setBolt12Destination] = useState<string | null>(localStorage.getItem(WALLET_BOLT12_DESTINATION))
    const [btcAddress, setBtcAddress] = useState<string | null>(localStorage.getItem(WALLET_BTC_ADDRESS))

    const btcLimits = JSON.parse(sessionStorage.getItem(SESSION_BTC_LIMITS) || JSON.stringify({ min: 0, max: 0}))
    const lnLimits = JSON.parse(sessionStorage.getItem(SESSION_LIGHTNING_LIMITS) || JSON.stringify({ min: 0, max: 0}))

    const [bitcoinLimits, setBitcoinLimits] = useState<Limit>(btcLimits)
    const [lightningLimits, setLightningLimits] = useState<Limit>(lnLimits)

    const loadSdk = async (mnemonic: string) => {
        const sdk = await initBreezSdk(mnemonic)
        setBreezSdk(sdk)
        
        if (!bolt12Destination) {
            const bolt12 = await getBolt12Destination(sdk)
            if (bolt12) {
                setBolt12Destination(bolt12)
                localStorage.setItem(WALLET_BOLT12_DESTINATION, bolt12)
            }
        }

        if (!btcAddress) {
            const addr = await getBtcAddress(sdk)
            if (addr) {
                setBtcAddress(addr)
                localStorage.setItem(WALLET_BTC_ADDRESS, addr)
            }
        }

        if (!sessionStorage.getItem(SESSION_BTC_LIMITS) || !sessionStorage.getItem(SESSION_LIGHTNING_LIMITS) || requiredReloadLimits()) {
            console.log('loading limits')
            const { bitcoin, lightning } = await storePreloadedLimits(sdk)
            setBitcoinLimits(bitcoin)
            setLightningLimits(lightning)
        }
    }

    useEffect(() => {
        const checkWallet = () => {
            if(!walletExists) {
                setWalletExists(true)
            }
            else {
                setWalletExists(false)
             }
        }

        // Listen for other tabs / external changes
        window.addEventListener("storage", checkWallet);

        return () => window.removeEventListener("storage", checkWallet);
    }, [])

    useEffect(() => {
        if (!promptForPassword) {
            const mnemonic = sessionStorage.getItem(SESSION_MNEMONIC_KEY);
            if (mnemonic) {
                loadSdk(mnemonic)
            }
            
        }
        
        const interval = setInterval(() => {
            if (requireUnlock()) {
                localStorage.removeItem(WALLET_UNLOCK_LAST_DATE) 
                sessionStorage.removeItem(SESSION_MNEMONIC_KEY) 
                setPromptForPassword(true)
                setBreezSdk(undefined)
            }
        }, 1000);
        
        return () => clearInterval(interval);
    }, [promptForPassword])

    useEffect(() => {
        setInterval(() => {
            if (requiredReloadLimits()) {
                breezSdk && storePreloadedLimits(breezSdk)
            }
        }, 1_000)
    }, [])

    const decryptWallet = async (password: string) => {
        const cipher = localStorage.getItem(WALLET_KEY)
        if (!cipher) return false;
        const result = await decrypt(cipher, password)
        if (result) {
            setPromptForPassword(false)
            localStorage.setItem(WALLET_UNLOCK_LAST_DATE, Date.now().toString())
            sessionStorage.setItem(SESSION_MNEMONIC_KEY, result)

            loadSdk(result)
            return true
        }
        return false
    }

    const storeWallet = async (password: string) => {
        const enc = new TextEncoder();
        const keyMaterial =  await window.crypto.subtle.importKey(
            "raw",
            enc.encode(password),
            "PBKDF2",
            false,
            ["deriveBits", "deriveKey"],
        );

        const salt = window.crypto.getRandomValues(new Uint8Array(16));
        const key = await window.crypto.subtle.deriveKey(
            {
                name: "PBKDF2",
                salt: salt,
                iterations: 100000,
                hash: "SHA-256",
            },
            keyMaterial,
            { name: "AES-GCM", length: 256 },
            true,
            ["encrypt", "decrypt"],
        );

        const mnemonic = sessionStorage.getItem('wallet_mnemonic') as string;
        const iv = window.crypto.getRandomValues(new Uint8Array(12));
        const cipher = await window.crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(mnemonic));
        localStorage.setItem('wallet_cipher', JSON.stringify({
            cipher: Array.from(new Uint8Array(cipher)),
            iv: Array.from(iv),
            salt: Array.from(salt)
        }));
        sessionStorage.removeItem('wallet_mnemonic');
        setWalletExists(true)
    }

    return (
        <WalletContext.Provider
            value={{
                walletExists,
                promptForPassword,
                decryptWallet,
                breezSdk,
                storeWallet,
                bolt12Destination,
                btcAddress,
                bitcoinLimits,
                lightningLimits
            }}
        >
            {children}
        </WalletContext.Provider>
    );
};

const initBreezSdk = async (mnemonic: string) => {
    await init()

    const breezApiKey = import.meta.env.VITE_BREEZ_API_KEY
    let config = defaultConfig('mainnet', breezApiKey)
    const sdk = await connect({ config, mnemonic })
    console.log("Breez SDK connected")
    return sdk
}

async function getBolt12Destination(sdk: BindingLiquidSdk) {
    const prepareResponse = await sdk.prepareReceivePayment({
        paymentMethod: 'bolt12Offer'
    })

    if (prepareResponse) {
        const res = await sdk.receivePayment({
            prepareResponse
        })
        if (res) {
            return res.destination
        }
        return null
    }
    return null
}

async function getBtcAddress(sdk: BindingLiquidSdk) {
    const prepareResponse = await sdk.prepareReceivePayment({
        paymentMethod: 'bitcoinAddress'
    })

    if (prepareResponse) {
        const res = await sdk.receivePayment({
            prepareResponse
        })
        if (res) {
            const split = res.destination.split(':')[1].split("?")[0]
            return split
        }
        return null
    }
    return null
}

async function preloadLimits(sdk: BindingLiquidSdk) {
    const bitcoinLimits = await sdk.fetchOnchainLimits()
    const lightningLimits = await sdk.fetchLightningLimits()

    return {
        bitcoin: { 
            min: bitcoinLimits ? bitcoinLimits.send.minSat / (10**8) : 0,
            max: bitcoinLimits ? bitcoinLimits.send.maxSat / (10**8) : 0
        },
        lightning: { 
            min: lightningLimits ? lightningLimits.send.minSat / (10**8) : 0,
            max: lightningLimits ? lightningLimits.send.maxSat / (10**8) : 0
        }
    }
}

export const useWallet = () => {
    const context = useContext(WalletContext);
    if (!context) throw new Error('useWallet must be used within a WalletProvider');
    return context;
};