
import { Page } from "@/components/Page";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"
import { getSessionMnemonic, useWallet } from "@/lib/walletContext";
import { FormEvent, useState } from "react";

import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";

import { retrieveLaunchParams, retrieveRawInitData } from "@telegram-apps/sdk-react";
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

    async function secureWallet(e: FormEvent) {
        e.preventDefault()

        setError(null);
        if (!password || password == '') {
            setError(t('walletSecure.emptyPassword'));
            return;
        }

        try {
            setProgressValue(1)
            setProgressLabel(t('walletSecure.progress1'))
            const mnemonic = getSessionMnemonic()
            if (!mnemonic) {
                return navigate(-1)
            }

            const sdk = await wallet.loadSdk(mnemonic)
            if (!sdk) {
                setError("Cannot load the sdk")
                return 
            }

            // await wallet.storeWallet(password)

            await new Promise(r => setTimeout(r, 1000));
            
            // const sdk = await wallet.initWallet(password)
            // if (!sdk) {
            //     setError("Cannot load the sdk")
            //     return 
            // }
    
            // const mnemonic = getSessionMnemonic() as string
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

            const data = retrieveLaunchParams()
    
            await new Promise(r => setTimeout(r, 2000));
    
            setProgressLabel(t('walletSecure.progress66'))
            setProgressValue(66)

            const usernameDigest = await crypto.subtle.digest("sha-256", new TextEncoder().encode(data.tgWebAppData?.user?.username))

            const available = await sdk.checkLightningAddressAvailable({
                username: buf2hex(usernameDigest)
            })
            let info
            if (available) {
                info = await sdk.registerLightningAddress({
                    username: buf2hex(usernameDigest)
                })
            }
            else {
                info = await sdk.getLightningAddress()
            }

            if (!info?.lnurl) {
                setError(t('walletSecure.noLightningAddressGenerated'))
                return
            }

            const response = await registerUser({
                tapRootAddress: tapRootAddress, 
                publicKey: childPubkeyHex, 
                breezBtcAddress: await wallet.getBtcAddress(sdk) as string, 
                breezLnUrl: info.lnurl,
                tgInitData: lp
            })
    
            await new Promise(r => setTimeout(r, 2000));
    
            if (response.status < 400) {
                await wallet.storeWallet(mnemonic, password)
                setProgressValue(100)
                setProgressLabel(t('walletSecure.progress100'))
                return
            }
    
            setError(await response.json())
        }
        catch (e) {
            console.error(e)
            setError((e as Error).message)
        }
    }

    function goToWallet() {
        navigate('/', { replace: true });
    }

    return (
        <Page back={true}>
            <form className="flex flex-col gap-20" onSubmit={secureWallet}>
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
                        <Button type="button" className="w-40" onClick={() => goToWallet()}>{t('walletSecure.goToWalletButton')}</Button>
                    }
                    { progressValue == 0 &&
                        <Button className="w-40" type="submit">{t('walletSecure.registerButton')}</Button>
                    }
                </div>
            </form>
        </Page>
    );
}
