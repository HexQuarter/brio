
import { Page } from "@/components/Page";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"
import { useWallet } from "@/lib/useWallet";
import { useState } from "react";

import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";

import { retrieveRawInitData } from "@telegram-apps/sdk-react";
import { Progress } from "@/components/ui/progress";

export function SecureWalletPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const wallet = useWallet()
    const [progressValue, setProgressValue] = useState(0)
    const [progressLabel, setProgressLabel] = useState("")

    const [error, setError] = useState<string | null>(null);    
    const [password, setPassword] = useState<string>('');


    async function secureWallet() {
        setError(null);
        if (!password || password == '') {
            setError(t('walletSecure.emptyPassword'));
            return;
        }
       
        setProgressValue(1)
        setProgressLabel(t('walletSecure.progress0'))
        await wallet.storeWallet(password)
        
        const sdk = await wallet.decryptWallet(password)
        await new Promise(r => setTimeout(r, 2000));
        setProgressValue(25)

        setProgressLabel(t('walletSecure.progress25'))
        
        const lp = retrieveRawInitData()
        if (!lp) {
            alert('Cannot retrieve Telegram init data')
            return
        }

        await new Promise(r => setTimeout(r, 2000));
        setProgressValue(50)

        setProgressLabel(t('walletSecure.progress50'))
        const walletInfo = await sdk?.getInfo()
        await new Promise(r => setTimeout(r, 2000));
        setProgressValue(75)

        setProgressLabel(t('walletSecure.progress75'))

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
                    initData: lp
                }
            })
        })

        await new Promise(r => setTimeout(r, 2000));

        if (response.status == 201) {
            setProgressValue(100)
            setProgressLabel(t('walletSecure.progress100'))
        }

        setError(response.statusText)
    }

    function goToWallet() {
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
                { progressValue == 0 &&
                    <div className="flex flex-col gap-5">
                        <p>{t('walletSecure.description')}</p>
                        <Input type="password" placeholder={t('walletSecure.inputPlaceholder')} onChange={(e) => setPassword(e.target.value)} />
                    </div>
                }
                {error && <p className="text-red-500 text-sm italic mt-2">{error}</p>}
                <div className="flex justify-center items-center flex-col gap-5">
                    {progressValue > 0 &&
                        <div className="flex flex-col gap-5 w-full text-center">
                                <Progress value={progressValue} />
                            <p>{progressLabel}</p>
                        </div>
                    }
                    {progressValue == 100 &&
                        <Button className="w-40" onClick={() => goToWallet()}>{t('walletSecure.goToWalletButton')}</Button>
                    }
                    { progressValue == 0 &&
                        <Button className="w-40" onClick={() => secureWallet()}>{t('walletSecure.registerButton')}</Button>
                    }
                </div>
            </div>
        </Page>
    );
}
