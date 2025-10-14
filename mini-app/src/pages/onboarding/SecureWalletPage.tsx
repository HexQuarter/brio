
import { Page } from "@/components/Page";
import { Button } from "@/components/ui/button";
import { getSessionMnemonic, useWallet } from "@/lib/walletContext";
import { useEffect, useState } from "react";

import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";

import { retrieveRawInitData, requestContact } from "@telegram-apps/sdk-react";
import { Progress } from "@/components/ui/progress";

import { registerUser } from "@/lib/api";
import { buf2hex, generateChildKey, generateTapRootAddress, hash } from "@/helpers/crypto";

export function SecureWalletPage() {
    const wallet = useWallet()
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [progressValue, setProgressValue] = useState(0)
    const [progressLabel, setProgressLabel] = useState("")

    const [error, setError] = useState<string | null>(null);    

    useEffect(() => {
        secureWallet()
    }, [])

    async function secureWallet() {
        try {
            setProgressValue(1)
            setProgressLabel(t('walletSecure.progress1'))
            const mnemonic = getSessionMnemonic() as string
            const sdk = await wallet.loadSdk(mnemonic)
            if (!sdk) {
                setError("Cannot load the sdk")
                return 
            }

            await new Promise(r => setTimeout(r, 1000));
            
            const childKey = await generateChildKey(mnemonic)
            if (!childKey.publicKey) {
                setError('Cannot retrieve Bitcoin public key')
                return
            }
            const childPubkeyHex = buf2hex(new Uint8Array(childKey.publicKey).buffer)
            const tapRootAddress = await generateTapRootAddress(childKey.publicKey)
            if (!tapRootAddress) {
                setError('Cannot retrieve Bitcoin address')
                return
            }
            await new Promise(r => setTimeout(r, 1000));
    
            setProgressValue(33)
    
            setProgressLabel(t('walletSecure.progress33'))
            let hashedPhoneNumber: undefined | string = undefined

            if (import.meta.env.DEV) {
                hashedPhoneNumber = await hash('+33123456789')
            }
            else {
                const result = requestContact.ifAvailable()
                if (result[0]) {
                    try {
                        const contact = await result[1]
                        let phoneNumber = contact.contact.phone_number
                        if (!phoneNumber.startsWith('+')) {
                            phoneNumber = `+${phoneNumber}`
                        }
                        hashedPhoneNumber = await hash(phoneNumber)
                        console.log(hashedPhoneNumber)
                    }
                    catch(e) {}
                }
            }

            const lp = retrieveRawInitData()
            if (!lp) {
                setError('Cannot retrieve Telegram init data')
                return
            }

            await new Promise(r => setTimeout(r, 2000));
    
            setProgressLabel(t('walletSecure.progress66'))
            setProgressValue(66)
            const registerLightningAddressRequest = { username: tapRootAddress }
            const available = await sdk.checkLightningAddressAvailable(registerLightningAddressRequest)
            let info
            if (available) {
                info = await sdk.registerLightningAddress(registerLightningAddressRequest)
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
                tgInitData: lp,
                hashedPhoneNumber: hashedPhoneNumber
            })
    
            await new Promise(r => setTimeout(r, 2000));
    
            if (response.status < 400) {
                await wallet.storeWallet(mnemonic)
                setProgressValue(100)
                setProgressLabel(t('walletSecure.progress100'))
                return
            }
    
            setError(JSON.stringify(await response.json()))
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
        <Page back={false}>
            <div className="flex flex-col gap-10">
                <div className='flex flex-col gap-5'>
                    <div className="flex flex-col gap-10">
                        <h2 className='text-4xl'>{t('walletSecure.title')}</h2>
                    </div>
                </div>
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
                    {/* { progressValue == 0 &&
                        <Button className="w-40" type="submit">{t('walletSecure.registerButton')}</Button>
                    } */}
                </div>
            </div>
        </Page>
    );
}
