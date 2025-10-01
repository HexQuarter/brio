
import { Page } from "@/components/Page";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"
import { getSessionMnemonic, useWallet } from "@/lib/useWallet";
import { useState } from "react";

import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";

import { retrieveRawInitData } from "@telegram-apps/sdk-react";
import { Progress } from "@/components/ui/progress";

import { registerUser } from "@/lib/api";
import { buf2hex, generateChildKey, generateTapRootAddress } from "@/helpers/crypto";

export function SecureWalletPage() {
    const wallet = useWallet()
    const { t } = useTranslation();
    const navigate = useNavigate();
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
        setProgressLabel(t('walletSecure.progress1'))
        await wallet.storeWallet(password)
        
        const sdk = await wallet.initWallet(password)
        if (!sdk) {
            return
        }

        const mnemonic = getSessionMnemonic() as string
        const childKey = await generateChildKey(mnemonic)
        if (!childKey.publicKey) {
            return
        }
        const childPubkeyHex = buf2hex(new Uint8Array(childKey.publicKey).buffer)
        const tapRootAddress = await generateTapRootAddress(childKey.publicKey)
        if (!tapRootAddress) {
            return
        }
        await new Promise(r => setTimeout(r, 1000));

        setProgressValue(33)

        setProgressLabel(t('walletSecure.progress33'))
        
        const lp = retrieveRawInitData()
        if (!lp) {
            alert('Cannot retrieve Telegram init data')
            return
        }

        await new Promise(r => setTimeout(r, 2000));

        setProgressLabel(t('walletSecure.progress66'))
        setProgressValue(66)

        const response = await registerUser({
            tapRootAddress: tapRootAddress, 
            publicKey: childPubkeyHex, 
            breezBtcAddress: wallet.btcAddress as string, 
            breezBolt12Offer: wallet.bolt12Offer as string, 
            tgInitData: lp
        })

        await new Promise(r => setTimeout(r, 2000));

        if (response.status == 201) {
            setProgressValue(100)
            setProgressLabel(t('walletSecure.progress100'))
            return
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
