import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from '../ui/button';
import { useNavigate } from 'react-router-dom';
import { t } from 'i18next';
import { useWallet } from '@/lib/useWallet';

export const WalletSettings : React.FC = () => {
    const navigate = useNavigate()
    const { currency, changeCurrency} = useWallet()

    return (
        <div className="flex flex-col bg-white p-5 w-full rounded-sm">
            <h3 className="text-2xl font-medium">{t('wallet.settings')}</h3>
            <div className='mt-10 flex flex-col gap-2'>
                <div className='flex justify-between'>
                    <span>{t('wallet.settings.currency')}</span>
                    <span>
                        <Select value={currency} onValueChange={changeCurrency}>
                            <SelectTrigger>
                                <SelectValue placeholder={currency} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="usd">USD</SelectItem>
                                <SelectItem value="eur">EUR</SelectItem>
                            </SelectContent>
                        </Select>
                    </span>
                </div>
                <div className='flex justify-between'>
                    <Button 
                        className="p-0 font-normal active:font-medium" 
                        variant="ghost" 
                        onClick={() => navigate('/wallet/backup')}>
                            {t('wallet.settings.backup')}
                    </Button>
                </div>
            </div>
        </div>
    )
}