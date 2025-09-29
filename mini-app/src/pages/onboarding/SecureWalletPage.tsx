
import { Page } from "@/components/Page";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"
import { useWallet } from "@/lib/useWallet";
import { useState } from "react";

import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";

import { retrieveLaunchParams } from "@telegram-apps/sdk-react";

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
        const sdk = await wallet.decryptWallet(password)

        const lp = retrieveLaunchParams()
        const walletInfo = await sdk?.getInfo()
        console.log(walletInfo)

        console.log(JSON.stringify({
                operation: 'create-user',
                payload: {
                    publicKey: walletInfo?.walletInfo.pubkey,
                    initData: lp.tgWebAppData
                }
            }))

        const response = await fetch('https://dev.backend.brio.hexquarter.com/rpc', {
            method: 'POST',
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify({
                operation: 'create-user',
                payload: {
                    publicKey: walletInfo?.walletInfo.pubkey,
                    initData: lp.tgWebAppData
                }
            })
        })
        if (response.status == 201) {
            navigate('/');
        }
        else {
            alert(`Err: ${JSON.stringify(response.json())}`)
        }
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
