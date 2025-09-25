import React, {useState} from 'react';
import { useTranslation } from 'react-i18next';
import { BsCurrencyBitcoin } from "react-icons/bs";
import { PiCurrencyDollarBold } from "react-icons/pi";


interface WalletBalanceProps {
    balance: number
    visibleBalance: boolean
}

export const WalletBalance: React.FC<WalletBalanceProps> = ({ visibleBalance = true, balance }) => {
    const { t } = useTranslation();

    const [bitcoinBalance, setBitcoinBalance] = useState(balance)
    const [fiatBalance, setFiatBalance] = useState(1000)

    return (
        <div className="flex flex-col">
           <p className='text-gray-400'>{t('wallet.totalBalance')}</p>
           <div className='flex gap-5'>
                  <div className="flex gap-2 items-center">
                  <PiCurrencyDollarBold className='text-primary text-3xl'/>
                  <span className="text-3xl font-medium">
                     {visibleBalance ? fiatBalance : '****'}
                  </span>
            </div>
            <div className="w-1 border-r-3 border-primary mt-2 mb-2"></div>
               <div className="flex gap-2 items-center">
                  <BsCurrencyBitcoin className='text-primary text-3xl'/>
                  <span className="text-3xl font-medium">
                     {visibleBalance ? bitcoinBalance : '****'}
                  </span>
               </div>
           </div>
        </div>
    )
};