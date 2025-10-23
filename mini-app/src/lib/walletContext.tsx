
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
import { toast } from 'sonner';
import { t } from 'i18next';
import { cloudStorage } from '@telegram-apps/sdk-react';
import { registerPayment } from './api';
import { convertSatsToBtc } from '@/helpers/number';

export type WalletContextType = {
    walletExists: boolean;
    loadSdk: (mnemonic: string) => Promise<BreezSdk | null>
    storeWallet: (mnemonic: string) => Promise<void>
    breezSdk: BreezSdk | undefined;
    getLnUrl: (breezSdk: BreezSdk) => Promise<string | null>
    getBtcAddress: (breezSdk: BreezSdk) => Promise<string | null>,
    currency: string,
    changeCurrency: (currency: string) => void,
    resetWallet: () => Promise<void>
    checkWallet: () => Promise<void>
};

const WalletContext = createContext<WalletContextType | undefined>(undefined);

const WALLET_KEY = 'wallet'
const WALLET_LN_URL = 'wallet_ln_url'
const WALLET_BTC_ADDRESS = 'wallet_btc_address'
const WALLET_CURRENCY = 'wallet_currency'

const notifications = new Set<string>()

class JsEventListener {
    onEvent = async (event: SdkEvent) => {
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
                if (event.payment.paymentType == 'send' && event.payment.status == 'completed') {
                    toast.success(t('wallet.sendPaymentSucceeded'))
                    switch (event.payment.details?.type) {
                        case 'lightning': 
                            await registerPayment('lightning', event.payment.details.paymentHash, convertSatsToBtc(event.payment.amount), undefined)
                            break
                        default:
                            console.log('not supported')
                            break
                    }
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
    const [walletExists, setWalletExists] = useState(!!sessionStorage.getItem(WALLET_KEY));
    const [breezSdk, setBreezSdk] = useState<BreezSdk | undefined>(undefined);
    const [lnUrl, setLnUrl] = useState<string | null>(null)
    const [btcAddress, setBtcAddress] = useState<string | null>(null)
    const [currency, setCurrency] = useState(sessionStorage.getItem(WALLET_CURRENCY)?.toUpperCase() || 'USD')

    useEffect(() => {
        const _loadSdk = async (mnemonic: string) => {
            await loadSdk(mnemonic) 
        }
        
        if (walletExists) {
            _loadSdk(getSessionMnemonic() as string)
        }
    }, [walletExists])

     const checkWallet = async () => {
        let wallet = sessionStorage.getItem(WALLET_KEY)
        if (!wallet) {
            if (!import.meta.env.DEV && cloudStorage.getItem.isAvailable()) {
                wallet = await cloudStorage.getItem(WALLET_KEY)
                if (wallet) {
                    sessionStorage.setItem(WALLET_KEY, wallet)
                    setWalletExists(true)

                    const _currency = await cloudStorage.getItem(WALLET_CURRENCY)
                    if (!_currency) {
                        return
                    }
                    await changeCurrency(_currency)
                }
            }
        }

        const walletExists = !!wallet
        setWalletExists(walletExists)
    }

    useEffect(() => {
        window.addEventListener("storage", checkWallet);
        return () => window.removeEventListener("storage", checkWallet);
    }, [])

    const resetWallet = async () => {
        sessionStorage.clear()
        if (!import.meta.env.DEV && cloudStorage.clear.isAvailable()) {
            await cloudStorage.clear()
        }

        setWalletExists(false)
    }

    const changeCurrency = async (value: string) => {
        sessionStorage.setItem(WALLET_CURRENCY, value)
        if (!import.meta.env.DEV && cloudStorage.setItem.isAvailable()) {
            await cloudStorage.setItem(WALLET_CURRENCY, value)
        }
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

    const storeWallet = async (mnemonic: string) => {
        sessionStorage.setItem(WALLET_KEY, mnemonic)
        if (!import.meta.env.DEV && cloudStorage.setItem.isAvailable()) {
            await cloudStorage.setItem(WALLET_KEY, mnemonic)
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

        const cachedLnUrl = sessionStorage.getItem(WALLET_LN_URL)
        if (cachedLnUrl) {
            return cachedLnUrl
        }

        const info = await breezSdk?.getLightningAddress()
        if (info) {
            setLnUrl(info.lnurl)
            sessionStorage.setItem(WALLET_LN_URL, info.lnurl)
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
        const cacheBtcAddress = sessionStorage.getItem(WALLET_BTC_ADDRESS)
        if (cacheBtcAddress) {
            return cacheBtcAddress
        }
        console.log('no from cache')
        const address = await fetchBtcAddress(breezSdk)
        if (address) {
            setBtcAddress(address)
            sessionStorage.setItem(WALLET_BTC_ADDRESS, address)
            return address
        }
        console.log('not from breez sdk')
        return null
    }

    return (
        <WalletContext.Provider
            value={{
                loadSdk,
                resetWallet,
                currency,
                changeCurrency,
                walletExists,
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
    return sessionStorage.getItem(WALLET_KEY);
}

export const storeSessionMnemonic = (mnemonic: string) => {
    sessionStorage.setItem(WALLET_KEY, mnemonic);
}