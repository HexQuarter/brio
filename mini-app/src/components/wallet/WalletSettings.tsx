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
import { useWallet } from '@/lib/walletContext';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export const WalletSettings : React.FC = () => {
    const navigate = useNavigate()
    const { currency, changeCurrency, resetWallet} = useWallet()

    const reset = () => {
        resetWallet()
        navigate('/')
    }

    return (
        <div className="flex flex-col bg-white p-5 w-full rounded-sm">
            <h3 className="text-2xl font-medium">{t('wallet.settings')}</h3>
            <div className='mt-10 flex flex-col gap-2'>
                <div className='flex justify-between h-8'>
                    <span>{t('wallet.settings.currency')}</span>
                    <span>
                        <Select value={currency} onValueChange={changeCurrency}>
                            <SelectTrigger>
                                <SelectValue placeholder={currency} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="USD">USD</SelectItem>
                                <SelectItem value="EUR">EUR</SelectItem>
                            </SelectContent>
                        </Select>
                    </span>
                </div>
                <div className='flex justify-between h-8'>
                    <Button 
                        className="p-0 font-normal active:font-medium" 
                        variant="ghost" 
                        onClick={() => navigate('/wallet/backup')}>
                            {t('wallet.settings.backup')}
                    </Button>
                </div>
                <div className='flex justify-between h-8'>
                    <AlertDialog>
                        <AlertDialogTrigger>{t('wallet.settings.reset')}</AlertDialogTrigger>
                        <AlertDialogContent className='border-0'>
                            <AlertDialogHeader >
                                <AlertDialogTitle>{t('wallet.settings.resetQuestion')}</AlertDialogTitle>
                                <AlertDialogDescription>{t('wallet.settings.resetWarning')}</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter className='flex flex-row'>
                                <AlertDialogCancel>{t('wallet.settings.resetCancel')}</AlertDialogCancel>
                                <AlertDialogAction onClick={() => reset()}>{t('wallet.settings.resetConfirmation')}</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </div>
        </div>
    )
}