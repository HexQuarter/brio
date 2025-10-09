
import { Page } from "@/components/Page";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"
import { FormEvent, useState } from "react";

import { useTranslation } from "react-i18next";
import { useWallet } from "@/lib/walletContext";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { LuCopy } from "react-icons/lu";

export function BackupWalletPage() {
    const { t } = useTranslation();
    const navigate = useNavigate()
    const [error, setError] = useState<null | string>(null)
    const [password, setPassword] = useState<string>('');
    const wallet = useWallet()
    const [mnemonic, setMnemonic] = useState<string[]>([])

    const displayMnemonic = async (e: FormEvent) => {
        e.preventDefault()

        setError(null);
        if (!password || password == '') {
            setError(t('walletUnlock.emptyPassword'));
            return;
        }

        const decryptedMnemonic = await wallet.decryptWallet(password)
        if(!decryptedMnemonic) {
            setError(t('walletUnlock.invalidPassword'));
            return
        }

        setMnemonic(decryptedMnemonic.split(' '))
    }

    const copy = async () => {
        await navigator.clipboard.writeText(mnemonic.join(' '))
        const toastId = toast.info(t('walletBackup.copyToast'))
        setTimeout(() => {
            toast.dismiss(toastId)
        }, 2000)
    }

    return (
        <Page back={true}>
            <div className="flex flex-col gap-20">
                <div className='flex flex-col gap-5'>
                    <div className="flex flex-col gap-10">
                        <h2 className='text-4xl'>{t('walletBackup.title')}</h2>
                    </div>
                </div>
                { mnemonic.join('').length > 0  &&
                    <div className="flex flex-col gap-10 w-full">
                        <p className="text-left">{t('walletBackup.subtitle')}</p>
                        <div className="flex flex-col gap-5">
                            <div className="grid grid-cols-2 gap-4 text-center">
                                {mnemonic.map((word, index) => (
                                    <div key={index} className="border-2 border-primary text-primary rounded p-4">{word}</div>
                                ))}
                            </div>
                            <div className="active:text-primary"><LuCopy className='w-5 h-5' onClick={() => copy()} /></div>
                        </div>
                        <div className="bg-orange-100 text-black-700 p-5 rounded" role="alert">
                            {t('walletBackup.warning')}
                        </div>
                        <div className="text-center"><Button onClick={() => navigate('/')}>{t('walletBackup.nextButton')}</Button></div>
                    </div>
                }
                {mnemonic.join('').length == 0 &&
                    <form onSubmit={displayMnemonic} className="flex flex-col gap-5">
                        <div className="flex flex-col gap-5">
                            <p>{t('walletUnlock.description')}</p>
                            <Input 
                                type="password" 
                                placeholder={t('walletUnlock.inputPlaceholder')} 
                                onChange={(e) => setPassword(e.target.value)} 
                                enterKeyHint="enter"/>
                            {error && <p className="text-red-500 text-sm italic mt-2">{error}</p>}
                        </div>
                        <div className="flex justify-center">
                            <Button className="w-40" type="submit">{t('walletUnlock.nextButton')}</Button>
                        </div>
                    </form>
                }
            </div>
        </Page>
    );
}
