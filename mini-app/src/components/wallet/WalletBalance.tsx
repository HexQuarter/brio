import React, {useEffect, useState} from 'react';
import { useTranslation } from 'react-i18next';
import { BsCurrencyBitcoin } from "react-icons/bs";
import { FiEye, FiSettings } from 'react-icons/fi';
import { 
   PiCurrencyDollarBold, 
   PiCurrencyEurBold, 
   PiCurrencyGbpBold,
   PiCurrencyJpyBold,
   PiCurrencyKrwBold,
   PiCurrencyKztBold,
   PiCurrencyNgnBold,
   PiCurrencyRubBold,
   PiCurrencyCnyBold,
   PiCurrencyInrBold
} from "react-icons/pi";
import { useLocation, useNavigate } from 'react-router-dom';

interface WalletBalanceProps {
    btcBalance: number
    fiatBalance: number,
    currency: string
}

export const WalletBalance: React.FC<WalletBalanceProps> = ({ btcBalance, fiatBalance, currency }) => {
   const { t } = useTranslation();
   const location = useLocation()
    
    const navigate = useNavigate()
    const [hideSettings, setHideSettings] = useState(false)

    useEffect(() => {
      if (location.pathname == '/wallet/settings') {
         setHideSettings(true)
      } else {
         setHideSettings(false)
      }
    }, [location])

    const [visibleBalance, setVisibleBalance] = useState(true)
    return (
        <div className="flex flex-col">
           <div className='flex gap-5 mb-3'>
               <p className='text-gray-400'>{t('wallet.totalBalance')}</p>
               <div className='flex gap-4 items-center'>
                  <FiEye className='text-gray-400' onClick={() => setVisibleBalance(!visibleBalance)}/>
                  {!hideSettings && <FiSettings className='text-gray-400' onClick={() => navigate('/wallet/settings')}/>}
               </div>
            </div>
           <div className='flex gap-5'>
               <div className="flex gap-2 items-center">
                  { currency == 'USD' && <PiCurrencyDollarBold className='text-primary text-3xl'/>}
                  { currency == 'EUR' && <PiCurrencyEurBold className='text-primary text-3xl'/>}
                  { currency == 'GBP' && <PiCurrencyGbpBold className='text-primary text-3xl'/>}
                  { currency == 'JPY' && <PiCurrencyJpyBold className='text-primary text-3xl'/>}
                  { currency == 'KRW' && <PiCurrencyKrwBold className='text-primary text-3xl'/>}
                  { currency == 'KZT' && <PiCurrencyKztBold className='text-primary text-3xl'/>}
                  { currency == 'NGN' && <PiCurrencyNgnBold className='text-primary text-3xl'/>}
                  { currency == 'RUB' && <PiCurrencyRubBold className='text-primary text-3xl'/>}
                  { currency == 'CNY' && <PiCurrencyCnyBold className='text-primary text-3xl'/>}
                  { currency == 'INR' && <PiCurrencyInrBold className='text-primary text-3xl'/>}
                  <span className="text-2xl font-medium">
                     {visibleBalance ? new Intl.NumberFormat("en", {maximumFractionDigits: 4}).format(fiatBalance) : '****'}
                  </span>
               </div>
               <div className="w-1 border-r-3 border-primary mt-2 mb-2"></div>
               <div className="flex gap-2 items-center">
                  <BsCurrencyBitcoin className='text-primary text-3xl'/>
                  <span className="text-2xl font-medium">
                     {visibleBalance ? new Intl.NumberFormat("en", {maximumFractionDigits: 8}).format(btcBalance) : '****'}
                  </span>
               </div>
           </div>
        </div>
    )
};