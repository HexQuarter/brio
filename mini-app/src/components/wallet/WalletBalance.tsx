import React, {useEffect, useState} from 'react';
import { useTranslation } from 'react-i18next';
import { FiEye, FiSettings } from 'react-icons/fi';
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
      if (location.pathname.includes('/wallet/settings')) {
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
                  {!hideSettings && <FiSettings className='text-gray-400' onClick={() => navigate('/app/wallet/settings')}/>}
               </div>
            </div>
           <div className='flex gap-5'>
               <div className="flex gap-2 items-center">
                  <span className="text-2xl font-medium">
                     {visibleBalance ? new Intl.NumberFormat("en", {maximumFractionDigits: 4}).format(fiatBalance) : '****'}
                  </span>
                  <span className='text-gray-500 text-2xl'>{ currency }</span>
               </div>
               <div className="w-1 border-r-3 border-primary mt-2 mb-2"></div>
               <div className="flex gap-2 items-center">
                  <span className="text-2xl font-medium">
                     {visibleBalance ? new Intl.NumberFormat("en", {maximumFractionDigits: 8}).format(btcBalance) : '****'}
                  </span>
                  <span className='text-gray-500 text-2xl'>BTC</span>
               </div>
           </div>
        </div>
    )
};