
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

import { useTranslation } from "react-i18next";
import { getSessionMnemonic, useWallet } from "@/lib/wallet/context";
import { toast } from "sonner";
import { LuCopy } from "react-icons/lu";

export function BackupWalletPage() {
    const { t } = useTranslation();
    const [mnemonic, setMnemonic] = useState<string[]>([])

    const wallet = useWallet()
    
    useEffect(() => {
        const mnemonic = getSessionMnemonic()
        if (!mnemonic) {
            const toastId = toast.error('Wallet not found')
            setTimeout(() => {
                toast.dismiss(toastId)
            }, 2000)
            window.location.replace("/#/apps");
            return
        }

        setMnemonic(mnemonic.split(' '))
    }, [wallet.walletExists])

    const copy = async () => {
        await navigator.clipboard.writeText(mnemonic.join(' '))
        const toastId = toast.info(t('walletBackup.copyToast'))
        setTimeout(() => {
            toast.dismiss(toastId)
        }, 2000)
    }

    return (
        <div className="flex flex-col gap-5">
            <div className='flex flex-col gap-5'>
                <div className="flex flex-col gap-10">
                    <h2 className='text-4xl'>{t('walletBackup.title')}</h2>
                </div>
            </div>
            { mnemonic.join('').length > 0  &&
                <div className="flex flex-col gap-10 w-full">
                    <p className="text-left">{t('walletBackup.subtitle')}</p>
                    <div className="flex flex-col gap-5">
                        <div className="active:text-primary"><LuCopy className='w-5 h-5' onClick={() => copy()} /></div>
                        <div className="grid grid-cols-2 gap-4 text-center">
                            {mnemonic.map((word, index) => (
                                <div key={index} className="border-2 border-primary text-primary rounded p-4">{word}</div>
                            ))}
                        </div>
                    </div>
                    <div className="bg-orange-100 text-black-700 p-5 rounded" role="alert">
                        {t('walletBackup.warning')}
                    </div>
                    <div className="text-center"><Button onClick={() => window.location.replace('#/app/wallet')}>{t('walletBackup.nextButton')}</Button></div>
                </div>
            }
        </div>
    );
}
