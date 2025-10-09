
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

import {
    BreezSdk,
    connect,
    defaultConfig,
    LogEntry,
    SdkEvent,
    initLogging,
    Seed
} from '@breeztech/breez-sdk-spark/web'
// import { webHookUrl } from './api';
// import { retrieveLaunchParams } from '@telegram-apps/sdk-react';
import { toast } from 'sonner';
import { t } from 'i18next';
import { cloudStorage } from '@telegram-apps/sdk-react';

export type WalletContextType = {
    walletExists: boolean;
    promptForPassword: boolean;
    initWallet: (mnemonic: string) => Promise<BreezSdk | null>
    decryptWallet: (password: string) => Promise<string | null>
    storeWallet: (password: string) => Promise<void>
    breezSdk: BreezSdk | undefined;
    getLnUrl: (breezSdk: BreezSdk) => Promise<string | null>
    getBtcAddress: (breezSdk: BreezSdk) => Promise<string | null>,
    currency: string,
    changeCurrency: (currency: string) => void,
    resetWallet: () => Promise<void>
    checkWallet: () => Promise<void>
};

const WalletContext = createContext<WalletContextType | undefined>(undefined);

const WALLET_KEY = 'wallet_cipher'
const WALLET_UNLOCK_LAST_DATE = 'wallet_unlock_last_date'
const WALLET_LN_URL = 'wallet_ln_url'
const WALLET_BTC_ADDRESS = 'wallet_btc_address'
const WALLET_CURRENCY = 'wallet_currency'

const SESSION_MNEMONIC_KEY = 'wallet_session_mnemonic'

const INACTIVITY_SPAN_MS = 10 * 60 * 1000; // 10 minutes

const notifications = new Set<string>()

class JsEventListener {
    onEvent = (event: SdkEvent) => {
        switch(event.type) {
            case "paymentSucceeded": 
                if (event.payment.status == 'pending') {
                    if (notifications.has(event.payment.id)) {
                        return
                    }
                    if (event.payment.paymentType == 'receive' && event.payment.status == 'pending') {
                        toast.success(t('wallet.receivePaymentPending'))
                    }
                    notifications.add(event.payment.id)
                }
                break
            case "paymentFailed":
                toast.error(t('wallet.paymentFailed'))
                break
            case "claimDepositsSucceeded":
                toast.info("claim deposit succeeed")
                break
            default:
                console.log('event', event)
        }
    }
}

class WebLogger {
  log = (l: LogEntry) => {
    console.log(`[${l.level}]: ${l.line}`)
  }
}

let logger: WebLogger | null = null;

export const WalletProvider = ({children}: {children: ReactNode}) => {
    const [walletExists, setWalletExists] = useState(!!localStorage.getItem(WALLET_KEY));
    const [promptForPassword, setPromptForPassword] = useState(
        walletExists && (
            !sessionStorage.getItem(SESSION_MNEMONIC_KEY) || requireUnlock()
        )
    );
    const [breezSdk, setBreezSdk] = useState<BreezSdk | undefined>(undefined);
    const [lnUrl, setLnUrl] = useState<string | null>(null)
    const [btcAddress, setBtcAddress] = useState<string | null>(null)
    const [currency, setCurrency] = useState(localStorage.getItem(WALLET_CURRENCY)?.toUpperCase() || 'USD')

    const checkWallet = async () => {
        let encryptedWallet = localStorage.getItem(WALLET_KEY)
        if (!encryptedWallet && cloudStorage.isSupported()) {
            encryptedWallet = await cloudStorage.getItem(WALLET_KEY)
            if (encryptedWallet) {
                localStorage.setItem(WALLET_KEY, encryptedWallet)
                setWalletExists(true)
            }
        }

        if(!encryptedWallet) {
            setWalletExists(false)
        }
        if (!sessionStorage.getItem(SESSION_MNEMONIC_KEY)) {
            setPromptForPassword(true)
        }
    }

    useEffect(() => {
        // Listen for other tabs / external changes
        window.addEventListener("storage", checkWallet);
        return () => window.removeEventListener("storage", checkWallet);
    }, [])

    useEffect(() => {
        async function _loadSdk(mnemonic: string) {
            await loadSdk(mnemonic)
        }

        if (!promptForPassword) {
            const mnemonic = sessionStorage.getItem(SESSION_MNEMONIC_KEY);
            if (mnemonic && !breezSdk) {
                _loadSdk(mnemonic)
            }
        }
        
        const interval = setInterval(() => {
            if (walletExists && requireUnlock()) {
                localStorage.removeItem(WALLET_UNLOCK_LAST_DATE) 
                sessionStorage.removeItem(SESSION_MNEMONIC_KEY) 
                setPromptForPassword(true)
                setBreezSdk(undefined)
            }
        }, 1000);
        
        return () => clearInterval(interval);
    }, [promptForPassword])

    const resetWallet = async () => {
        if (cloudStorage.isSupported()) {
            cloudStorage.deleteItem(WALLET_KEY)
        }
        localStorage.removeItem(WALLET_KEY)
        localStorage.removeItem(WALLET_UNLOCK_LAST_DATE )
        localStorage.removeItem(WALLET_LN_URL)
        localStorage.removeItem(WALLET_BTC_ADDRESS)
        localStorage.removeItem(WALLET_CURRENCY)

        sessionStorage.removeItem(SESSION_MNEMONIC_KEY)

        await breezSdk?.deleteLightningAddress()

        setWalletExists(false)
    }

    const changeCurrency = (value: string) => {
        localStorage.setItem(WALLET_CURRENCY, value)
        setCurrency(value)
    }

    const loadSdk = async (mnemonic: string) => {
        // If already initialized, just return the existing SDK
        let sdk = breezSdk
        if (!sdk) {
            sdk = await initBreezSdk(mnemonic)
            setBreezSdk(sdk)
        }

        return sdk
    }

    const initWallet = async (password: string) => {
        const result = await decryptWallet(password)
        if (result) {
            setPromptForPassword(false)
            localStorage.setItem(WALLET_UNLOCK_LAST_DATE, Date.now().toString())
            sessionStorage.setItem(SESSION_MNEMONIC_KEY, result)

            return await loadSdk(result)
        }
        throw new Error('Cannot decrypt the wallet')
    }

    const decryptWallet = async (password: string) => {
        const cipher = localStorage.getItem(WALLET_KEY)
        if (!cipher) return null;
        return await decrypt(cipher, password)
    }

    const storeWallet = async (password: string) => {
        const mnemonic = getSessionMnemonic()
        if (!mnemonic) {
            setWalletExists(false)
            return
        }

        const { cipher, iv, salt } = await encrypt(mnemonic, password)
    
        const encryptedWallet = JSON.stringify({
            cipher: Array.from(new Uint8Array(cipher)),
            iv: Array.from(iv),
            salt: Array.from(salt)
        })
        localStorage.setItem(WALLET_KEY, encryptedWallet);
        sessionStorage.removeItem(SESSION_MNEMONIC_KEY);
        if (cloudStorage.isSupported()) {
            await cloudStorage.setItem(WALLET_KEY, encryptedWallet)
        }
        setWalletExists(true)
    }

    const getLnUrl = async (breezSdk: BreezSdk) => {
        if (lnUrl) {
            return lnUrl
        }
        if (!breezSdk) {
            return  null
        }

        const cachedLnUrl = localStorage.getItem(WALLET_LN_URL)
        if (cachedLnUrl) {
            return cachedLnUrl
        }
        const info = await breezSdk?.getLightningAddress()
        if (info) {
            setLnUrl(info.lnurl)
            localStorage.setItem(WALLET_LN_URL, info.lnurl)
            return info.lnurl
        }
        return null
    }

     const getBtcAddress = async (breezSdk: BreezSdk) => {
        if (btcAddress) {
            return btcAddress
        }
        if (!breezSdk) {
            console.log('no breek sdk')
            return  null
        }
        const cacheBtcAddress = localStorage.getItem(WALLET_BTC_ADDRESS)
        if (cacheBtcAddress) {
            return cacheBtcAddress
        }
        console.log('no from cache')
        const address = await fetchBtcAddress(breezSdk)
        if (address) {
            setBtcAddress(address)
            localStorage.setItem(WALLET_BTC_ADDRESS, address)
            return address
        }
        console.log('not from breez sdk')
        return null
    }

    return (
        <WalletContext.Provider
            value={{
                resetWallet,
                currency,
                changeCurrency,
                walletExists,
                promptForPassword,
                initWallet,
                decryptWallet,
                storeWallet,
                breezSdk,
                getLnUrl,
                getBtcAddress,
                checkWallet
            }}
        >
            {children}
        </WalletContext.Provider>
    );
};

const initBreezSdk = async (mnemonic: string) => {
     if (!logger) {
      logger = new WebLogger();
      initLogging(logger);
    }

    try {
        const breezApiKey = import.meta.env.VITE_BREEZ_API_KEY
        let config = defaultConfig('mainnet')
        config.apiKey = breezApiKey
        // config.lnurlDomain = 'dev_brio.com'
    
        const seed: Seed = { type: 'mnemonic', mnemonic}
        
        const sdk = await connect({ config, seed, storageDir: "brio" })
        console.log('Wallet initialized successfully');
    
       const listener = await sdk.addEventListener(new JsEventListener())
       console.log(listener)
    
        return sdk
    }
    catch (e) {
        console.error('Failed to initialize wallet:', e);
        throw e;
    }
}

const requireUnlock = () => {
    const lastUnlockDate = localStorage.getItem(WALLET_UNLOCK_LAST_DATE) 
    return lastUnlockDate ? Date.now() - parseInt(lastUnlockDate) > INACTIVITY_SPAN_MS : true
}

export const fetchBtcAddress = async (sdk: BreezSdk) => {
    const res = await sdk.receivePayment({
        paymentMethod: { type: 'bitcoinAddress' }
    })

    if (res) {
        return res.paymentRequest
    }
    return null
}

export const useWallet = () => {
    const context = useContext(WalletContext);
    if (!context) throw new Error('useWallet must be used within a WalletProvider');
    return context;
};

export const getSessionMnemonic = () => {
    return sessionStorage.getItem(SESSION_MNEMONIC_KEY);
}

const encrypt = async(mnemonic: string, password: string) => {
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

    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const cipher = await window.crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(mnemonic));
    return { cipher, iv, salt}
}
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

export const storeSessionMnemonic = (mnemonic: string) => {
    sessionStorage.setItem(SESSION_MNEMONIC_KEY, mnemonic);
}