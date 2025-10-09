
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"
import { FormEvent, useState } from "react";

import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { useWallet } from "@/lib/walletContext";

export function UnlockWalletPage() {
    const wallet = useWallet()
    const { t } = useTranslation();
    const navigate = useNavigate();

    const [error, setError] = useState<string | null>(null);    
    const [password, setPassword] = useState<string>('');

    async function unlockWallet(e: FormEvent) {
        e.preventDefault()

        setError(null);
        if (!password || password == '') {
            setError(t('walletUnlock.emptyPassword'));
            return;
        }
        if(!await wallet.initWallet(password)) {
            setError(t('walletUnlock.invalidPassword'));
            return
        }

        navigate('/', { replace: true });
    }

    return (
            <div className="flex flex-col gap-20">
                <div className='flex flex-col gap-5'>
                    <div className="flex flex-col gap-10">
                        <h2 className='text-4xl'>{t('walletUnlock.title')}</h2>
                    </div>
                </div>
                <form onSubmit={unlockWallet} className="flex flex-col gap-5">
                    <div className="flex flex-col gap-5">
                        <p>{t('walletUnlock.description')}</p>
                        <Input 
                            type="password" 
                            placeholder={t('walletUnlock.inputPlaceholder')} 
                            onChange={(e) => setPassword(e.target.value)} 
                            enterKeyHint="enter" />
                        {error && <p className="text-red-500 text-sm italic mt-2">{error}</p>}
                    </div>
                    <div className="flex justify-center">
                        <Button className="w-40" type="submit">{t('walletUnlock.nextButton')}</Button>
                    </div>
                </form>
            </div>
    );
}
