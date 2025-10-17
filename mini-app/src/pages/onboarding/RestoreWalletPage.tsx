import { Page } from "@/components/Page";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";

import * as bip39 from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english.js';
import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { storeSessionMnemonic } from "@/lib/walletContext";

export function RestoreWalletPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();             

    const [mnemonic, setMnemonic] = useState<string[]>(["", "", "", "", "", "", "", "", "", "", "", ""]);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const handlePaste = (e: ClipboardEvent) => {
            e.preventDefault();

            setError(null);
            const clipboardData = e.clipboardData || (window as any).clipboardData;
            const pastedText = clipboardData.getData('Text').trim();
            const passphrase = [...Array(12)].map(() => '');
            const words = pastedText.split(/\s+/)
            words.forEach((word: string, index: number) => {
                passphrase[index] = word;
            });

            if (!bip39.validateMnemonic(passphrase.join(' '), wordlist)) {
                setError(t('walletRestore.invalidMnemonic'));
                return;
            }

            setMnemonic(passphrase);
        };

        // Attach to the first input for simplicity
        const input = document.querySelector('input');
        if (input) {
            input.addEventListener('paste', handlePaste as any);
        }
        return () => {
            if (input) {
                input.removeEventListener('paste', handlePaste as any);
            }
        };
    }, [])

    useEffect(() => {
        if (!bip39.validateMnemonic(mnemonic.join(' '), wordlist)) {
            return;
        }

        // Store in sessionStorage for safe transmission between pages (cleartext for now)
        storeSessionMnemonic(mnemonic.join(' '))
    }, [mnemonic]);

    const secureWallet = (e: FormEvent) => {
        e.preventDefault()
         navigate('/onboarding/secure-wallet')
    }
    
    return (
        <Page back={true}>
            <form className="flex flex-col gap-20" onSubmit={secureWallet}>
                <div className='flex flex-col gap-5'>
                    <div className="flex flex-col gap-10">
                        <h2 className='text-4xl'>{t('walletRestore.title')}</h2>
                        <p>{t('walletRestore.description')}</p>
                    </div>
                </div>
                <div className="grid grid-cols-3 gap-4 text-center">
                    {mnemonic.map((_word, index) => (
                        <input
                            key={index}
                            className={`border-2 rounded p-2 h-10 text-primary ${
                                error ? 'border-red-500 text-red-500' : 'border-primary'
                            }`}
                            onChange={(e) => {
                                const updated = [...mnemonic];
                                updated[index] = e.target.value;
                                setMnemonic(updated);
                            }}
                            value={mnemonic[index]}
                        />
                    ))}
                    {error && <p className="col-span-3 text-red-500 text-sm italic mt-2">{error}</p>}
                </div>
                {mnemonic.join('').length > 0 && !error && (
                    <div className="flex justify-center">
                        <Button type="submit">{t('walletRestore.nextButton')}</Button>
                    </div>
                )}
            </form>
        </Page>
    );
}
