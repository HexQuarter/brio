import React, {useState} from 'react';
import { useTranslation } from 'react-i18next';
import { BsCurrencyBitcoin } from "react-icons/bs";
import { FiEye, FiSettings } from 'react-icons/fi';
import { PiCurrencyDollarBold } from "react-icons/pi";

interface WalletBalanceProps {
    btcBalance: number
    fiatBalance: number
}

export const WalletBalance: React.FC<WalletBalanceProps> = ({ btcBalance, fiatBalance }) => {
    const { t } = useTranslation();

    const [visibleBalance, setVisibleBalance] = useState(true)
    return (
        <div className="flex flex-col">
           <div className='flex gap-5 mb-3'>
               <p className='text-gray-400'>{t('wallet.totalBalance')}</p>
               <div className='flex gap-4 items-center'>
                  <FiEye className='text-gray-400' onClick={() => setVisibleBalance(!visibleBalance)}/>
                  <FiSettings className='text-gray-400' />
               </div>
            </div>
           <div className='flex gap-5'>
               <div className="flex gap-2 items-center">
                  <PiCurrencyDollarBold className='text-primary text-3xl'/>
                  <span className="text-3xl font-medium">
                     {visibleBalance ? new Intl.NumberFormat("en", {maximumFractionDigits: 4}).format(fiatBalance) : '****'}
                  </span>
               </div>
               <div className="w-1 border-r-3 border-primary mt-2 mb-2"></div>
               <div className="flex gap-2 items-center">
                  <BsCurrencyBitcoin className='text-primary text-3xl'/>
                  <span className="text-3xl font-medium">
                     {visibleBalance ? new Intl.NumberFormat("en", {maximumFractionDigits: 8}).format(btcBalance) : '****'}
                  </span>
               </div>
           </div>
        </div>
    )
};