import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

import init, {
    BindingLiquidSdk,
    connect,
    defaultConfig,
} from '@breeztech/breez-sdk-liquid/web'

type WalletContextType = {
    walletExists: boolean;
    promptForPassword: boolean;
    decryptWallet: (password: string) => Promise<boolean>;
    breezSdk: BindingLiquidSdk | null;
};

const WalletContext = createContext<WalletContextType | undefined>(undefined);

const WALLET_KEY = 'wallet_cipher'
const WALLET_UNLOCK_LAST_DATE = 'wallet_unlock_last_date'
const SESSION_MNEMONIC_KEY = 'wallet_session_mnemonic'

const INACTIVITY_SPAN_MS = 10 * 60 * 1000; // 10 minutes

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

export const WalletProvider = ({children}: {children: ReactNode}) => {
    const cipher = localStorage.getItem(WALLET_KEY)

    const [walletExists, _setWalletExists] = useState(!!cipher);
    const [promptForPassword, setPromptForPassword] = useState(!!cipher && requireUnlock());
    const [breezSdk, setBreezSdk] = useState<BindingLiquidSdk | null>(null);

    const loadSdk = async (mnemonic: string) => {
        const sdk = await initBreezSdk(mnemonic)
        setBreezSdk(sdk)
    }

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
                setBreezSdk(null)
            }
        }, 1000);
        
        return () => clearInterval(interval);
    }, [promptForPassword])

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

    return (
        <WalletContext.Provider
            value={{
                walletExists,
                promptForPassword,
                decryptWallet,
                breezSdk
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

export const useWallet = () => {
    const context = useContext(WalletContext);
    if (!context) throw new Error('useWallet must be used within a WalletProvider');
    return context;
};