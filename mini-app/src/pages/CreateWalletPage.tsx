import { Page } from "@/components/Page";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";

import * as bip39 from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english.js';
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export function CreateWalletPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();             

    const [mnemonic, setMnemonic] = useState<string[]>([]);

    useEffect(() => {
        const generatedMnemonic = bip39.generateMnemonic(wordlist);
        setMnemonic(generatedMnemonic.split(' '));
        // Store in sessionStorage for safe transmission between pages (cleartext for now)
        sessionStorage.setItem('wallet_mnemonic', generatedMnemonic);
    }, []);

    return (
        <Page back={false}>
            <div className="flex flex-col gap-20">
                <div className='flex flex-col gap-5'>
                    <div className="flex flex-col gap-10">
                        <h2 className='text-4xl'>{t('walletCreate.title')}</h2>
                        <p>{t('walletCreate.description')}</p>
                    </div>
                </div>
                <div className="grid grid-cols-3 gap-4 text-center">
                    {mnemonic.map((word, index) => (
                        <div key={index} className="border-2 border-primary text-primary rounded  p-2">{word}</div>
                    ))}
                </div>
                <div className="bg-orange-100 text-black-700 p-5 rounded" role="alert">
                    {t('walletCreate.warning')}
                </div>
                <div className="flex justify-center">
                    <Button className="w-40" onClick={() => navigate('/wallet/secure')}>{t('walletCreate.nextButton')}</Button>
                </div>
            </div>
        </Page>
    );
}
