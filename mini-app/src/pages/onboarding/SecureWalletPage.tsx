
import { Page } from "@/components/Page";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"
import { useWallet } from "@/lib/useWallet";
import { useState } from "react";

import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";

import { retrieveLaunchParams } from "@telegram-apps/sdk-react";
import { sendData } from '@telegram-apps/sdk';
import { buf2hex } from "@/helpers/crypto";

export function SecureWalletPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const wallet = useWallet()

    const [error, setError] = useState<string | null>(null);    
    const [password, setPassword] = useState<string>('');

    if (!sessionStorage.getItem('wallet_mnemonic')) {
        console.log('No mnemonic found, redirecting to setup');
        navigate('/onboarding')
        return;
    }

    async function secureWallet() {
        setError(null);
        if (!password || password == '') {
            setError(t('walletSecure.emptyPassword'));
            return;
        }
        await wallet.storeWallet(password)

        const lp = retrieveLaunchParams()

        const digestHandle = await crypto.subtle.digest('sha-256', new TextEncoder().encode(lp.tgWebAppData?.user?.username as string))
        console.log('send available', sendData.isAvailable())
        console.log('send supported', sendData.isSupported())
        sendData(JSON.stringify( { action: "new-wallet", handle: buf2hex(digestHandle) }));
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
