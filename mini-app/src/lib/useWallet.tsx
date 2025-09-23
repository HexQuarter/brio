import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type WalletContextType = {
    walletExists: boolean;
    decryptedWallet: string | null;
    promptForPassword: boolean;
    decryptWallet: (password: string) => Promise<boolean>;
};

const WalletContext = createContext<WalletContextType | undefined>(undefined);

const WALLET_KEY = 'wallet_cipher';
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
        );
        const decrypted = await window.crypto.subtle.decrypt(
            {
                name: "AES-GCM",
                iv: new Uint8Array(ivArr),
            },
            key,
            new Uint8Array(cipherArr)
        );
        return new TextDecoder().decode(decrypted);
    } catch {
        return null;
    }
}

export const WalletProvider = ({children}: {children: ReactNode}) => {
    const cipher = localStorage.getItem(WALLET_KEY);

    const [walletExists, _setWalletExists] = useState(!!cipher);
    const [decryptedWallet, setDecryptedWallet] = useState<string | null>(null);
    const [promptForPassword, setPromptForPassword] = useState(!!cipher);
    const [lastActive, setLastActive] = useState(Date.now());

    useEffect(() => {
        const interval = setInterval(() => {
            if (decryptedWallet && Date.now() - lastActive > INACTIVITY_SPAN_MS) {
                setDecryptedWallet(null);
                setPromptForPassword(true);
                clearInterval(interval);
            }
        }, 1000);
    }, [decryptedWallet, lastActive]);

    const decryptWallet = async (password: string) => {
        const cipher = localStorage.getItem(WALLET_KEY);
        if (!cipher) return false;
        const result = await decrypt(cipher, password);
        if (result) {
            setDecryptedWallet(result);
            setPromptForPassword(false);
            setLastActive(Date.now());
            return true;
        }
        return false;
    };

    return (
        <WalletContext.Provider
            value={{
                walletExists,
                decryptedWallet,
                promptForPassword,
                decryptWallet,
            }}
        >
            {children}
        </WalletContext.Provider>
    );
};

export const useWallet = () => {
    const context = useContext(WalletContext);
    if (!context) throw new Error('useWallet must be used within a WalletProvider');
    return context;
};