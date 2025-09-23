
import { Page } from "@/components/Page";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"
import { useState } from "react";

import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";

export function SecureWalletPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const [error, setError] = useState<string | null>(null);    
    const [password, setPassword] = useState<string>('');

    if (!sessionStorage.getItem('wallet_mnemonic')) {
        console.log('No mnemonic found, redirecting to setup');
        navigate('/wallet/setup')
        return;
    }

    async function secureWallet() {
        setError(null);
        if (!password || password == '') {
            setError(t('walletSecure.emptyPassword'));
            return;
        }
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
        navigate('/');
    }

    return (
        <Page back={true}>
            <div className="flex flex-col gap-20">
                <div className='flex flex-col gap-5'>
                    <div className="flex flex-col gap-10">
                        <h2 className='text-4xl'>{t('walletSecure.title')}</h2>
                    </div>
                </div>
                <div className="flex flex-col gap-5">
                    <p>{t('walletSecure.description')}</p>
                    <Input type="password" placeholder={t('walletSecure.inputPlaceholder')} onChange={(e) => setPassword(e.target.value)} />
                    {error && <p className="text-red-500 text-sm italic mt-2">{error}</p>}
                </div>
                <div className="flex justify-center">
                    <Button className="w-40" onClick={() => secureWallet()}>{t('walletSecure.nextButton')}</Button>
                </div>
            </div>
        </Page>
    );
}
