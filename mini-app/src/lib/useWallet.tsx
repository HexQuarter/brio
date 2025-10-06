
import { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';

import init, {
    BindingLiquidSdk,
    connect,
    defaultConfig,
    LogEntry,
    SdkEvent,
    setLogger,
} from '@breeztech/breez-sdk-liquid/web'
import { webHookUrl } from './api';
import { retrieveLaunchParams } from '@telegram-apps/sdk-react';
import { toast } from 'sonner';
import { t } from 'i18next';

export type WalletContextType = {
    walletExists: boolean;
    promptForPassword: boolean;
    initWallet: (mnemonic: string) => Promise<BindingLiquidSdk | null>
    decryptWallet: (password: string) => Promise<string | null>
    storeWallet: (password: string) => Promise<void>
    breezSdk: BindingLiquidSdk | undefined;
    getBolt12Offer: (breezSdk: BindingLiquidSdk) => Promise<string | null>
    getBtcAddress: (breezSdk: BindingLiquidSdk) => Promise<string | null>,
    currency: string,
    changeCurrency: (currency: string) => void,
    resetWallet: () => void
};

const WalletContext = createContext<WalletContextType | undefined>(undefined);

const WALLET_KEY = 'wallet_cipher'
const WALLET_UNLOCK_LAST_DATE = 'wallet_unlock_last_date'
const WALLET_BOLT12_OFFER = 'wallet_bolt12_offer'
const WALLET_BTC_ADDRESS = 'wallet_btc_address'
const WALLET_CURRENCY = 'wallet_currency'

const SESSION_MNEMONIC_KEY = 'wallet_session_mnemonic'

const INACTIVITY_SPAN_MS = 10 * 60 * 1000; // 10 minutes

export const WalletProvider = ({children}: {children: ReactNode}) => {    
    const [walletExists, setWalletExists] = useState(!!localStorage.getItem(WALLET_KEY));
    const [promptForPassword, setPromptForPassword] = useState(
        walletExists && (
            !sessionStorage.getItem(SESSION_MNEMONIC_KEY) || requireUnlock()
        )
    );
    const [breezSdk, setBreezSdk] = useState<BindingLiquidSdk | undefined>(undefined);
    const [bolt12Offer, setBolt12Offer] = useState<string | null>(null)
    const [btcAddress, setBtcAddress] = useState<string | null>(null)
    const [currency, setCurrency] = useState(localStorage.getItem(WALLET_CURRENCY)?.toUpperCase() || 'USD')

    // Ref to prevent duplicate SDK init
    const sdkInitRef = useRef(false);

    useEffect(() => {
        const checkWallet = () => {
            if(!localStorage.getItem(WALLET_KEY)) {
                setWalletExists(false)
            }
            if (!sessionStorage.getItem(SESSION_MNEMONIC_KEY)) {
                setPromptForPassword(true)
            }
        }

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

    const resetWallet = () => {
        localStorage.removeItem(WALLET_KEY)
        localStorage.removeItem(WALLET_UNLOCK_LAST_DATE )
        localStorage.removeItem(WALLET_BOLT12_OFFER)
        localStorage.removeItem(WALLET_BTC_ADDRESS)
        localStorage.removeItem(WALLET_CURRENCY)

        sessionStorage.removeItem(SESSION_MNEMONIC_KEY)

        setWalletExists(false)
    }

    const changeCurrency = (value: string) => {
        localStorage.setItem(WALLET_CURRENCY, value)
        setCurrency(value)
    }

    const loadSdk = async (mnemonic: string) => {
        if (sdkInitRef.current) return null;

        // If already initialized, just return the existing SDK
        let sdk = breezSdk
        if (!sdk) {
            sdkInitRef.current = true;
            sdk = await initBreezSdk(mnemonic)
            if (!import.meta.env.DEV) {
                const params = retrieveLaunchParams()
                const userId = params.tgWebAppData?.user?.id
                if (userId) {
                    await sdk.unregisterWebhook()
                    await sdk.registerWebhook(webHookUrl(userId))
                    console.log(`Register webhook for ${webHookUrl(userId)}`)
                }
            }
            setBreezSdk(sdk)
        }

        // await getBolt12Offer(sdk)
        // await getBtcAddress(sdk)

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
    
        localStorage.setItem(WALLET_KEY, JSON.stringify({
            cipher: Array.from(new Uint8Array(cipher)),
            iv: Array.from(iv),
            salt: Array.from(salt)
        }));
        sessionStorage.removeItem(SESSION_MNEMONIC_KEY);
        setWalletExists(true)
    }

    const getBolt12Offer = async (breezSdk: BindingLiquidSdk) => {
        if (bolt12Offer) {
            return bolt12Offer
        }
        if (!breezSdk) {
            return  null
        }

        const cachedBolt12Offer = localStorage.getItem(WALLET_BOLT12_OFFER)
        if (cachedBolt12Offer) {
            return cachedBolt12Offer
        }
        const offer = await fetchBolt12Offer(breezSdk)
        if (offer) {
            setBolt12Offer(offer)
            localStorage.setItem(WALLET_BOLT12_OFFER, offer)
            return offer
        }
        return null
    }

     const getBtcAddress = async (breezSdk: BindingLiquidSdk) => {
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
                getBolt12Offer,
                getBtcAddress
            }}
        >
            {children}
        </WalletContext.Provider>
    );
};

class JsEventListener {

    private handledEvents = new Set<string>()

    onEvent = (event: SdkEvent) => {
        switch(event.type) {
            case "paymentWaitingConfirmation":
                toast.info(t('wallet.paymentWaitingConfirmation'))
                break
            case "paymentWaitingFeeAcceptance":
                toast.info(t('wallet.paymentWaitingFeeAcceptance'))
                break
            case "paymentPending":
                if(event.details.txId && this.handledEvents.has(event.details.txId)) {
                    this.handledEvents.add(event.details.txId)
                    toast.info(t('wallet.paymentPending'))
                }
                break
            case "paymentSucceeded":
                toast.success(t('wallet.paymentSucceeded'))
                break
            case "paymentFailed":
                toast.error(t('wallet.paymentFailed'))
                break
            default:
                console.log('event', JSON.stringify(event))
        }
    }
}

class JsLogger {
  log = (l: LogEntry) => {
    console.log(`[${l.level}]: ${l.line}`)
  }
}

const initBreezSdk = async (mnemonic: string) => {
    await init()
    setLogger(new JsLogger())

    const breezApiKey = import.meta.env.VITE_BREEZ_API_KEY
    let config = defaultConfig('mainnet', breezApiKey)
    const sdk = await connect({ config, mnemonic })
    await sdk.addEventListener(new JsEventListener())

    console.log("Breez SDK connected")
    return sdk
}

const requireUnlock = () => {
    const lastUnlockDate = localStorage.getItem(WALLET_UNLOCK_LAST_DATE) 
    return lastUnlockDate ? Date.now() - parseInt(lastUnlockDate) > INACTIVITY_SPAN_MS : true
}

export const fetchBolt12Offer = async (sdk: BindingLiquidSdk) => {
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

export const fetchBtcAddress = async (sdk: BindingLiquidSdk) => {
    const prepareResponse = await sdk.prepareReceivePayment({
        paymentMethod: 'bitcoinAddress'
    })

    if (prepareResponse) {
        const res = await sdk.receivePayment({
            prepareResponse
        })
        if (res) {
            const split = res.destination.split(':')[1].split("?")[0]
            console.log(split)
            return split
        }
        return null
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