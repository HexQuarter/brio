
import { Page } from "@/components/Page";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"
import { getSessionMnemonic, useWallet } from "@/lib/useWallet";
import { useState } from "react";

import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";

import { retrieveRawInitData } from "@telegram-apps/sdk-react";
import { Progress } from "@/components/ui/progress";

import * as bip39 from '@scure/bip39';
import * as bip32 from '@scure/bip32';
import { buf2hex } from "@/helpers/crypto";

export function SecureWalletPage() {
    const { initWallet, storeWallet, btcAddress, bolt12Destination} = useWallet()
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
        await storeWallet(password)
        
        const sdk = await initWallet(password)
        if (!sdk) {
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

        const mnemonic = getSessionMnemonic()
        const seed = await bip39.mnemonicToSeed(mnemonic as string)
        const hdkey = bip32.HDKey.fromMasterSeed(seed)
        const child = hdkey.derive("m/86'/0'/0'/0/0")
        if (!child.publicKey) {
            return
        }
        const pub = child.publicKey
        const pubHex = buf2hex(new Uint8Array(pub).buffer)

        const rpcEndpoint = import.meta.env.DEV ? 'http://localhost:3000/rpc' : 'https://dev.backend.brio.hexquarter.com/rpc'

        const response = await fetch(rpcEndpoint, {
            method: 'POST',
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify({
                operation: 'create-user',
                payload: {
                    publicKey: pubHex,
                    breezBtcAddress: btcAddress,
                    breezBolt12Destination: bolt12Destination,
                    tgInitData: lp
                }
            })
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
