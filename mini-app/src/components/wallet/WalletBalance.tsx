import React, {useEffect, useState} from 'react';
import { useTranslation } from 'react-i18next';
import { BsCurrencyBitcoin } from "react-icons/bs";
import { FiEye, FiSettings } from 'react-icons/fi';
import { PiCurrencyDollarBold } from "react-icons/pi";

import { fetchBtcPrice } from '@/lib/coingecko';

interface WalletBalanceProps {
    balance: number
}

export const WalletBalance: React.FC<WalletBalanceProps> = ({ balance }) => {
    const { t } = useTranslation();

    const [visibleBalance, setVisibleBalance] = useState(true)
    const [bitcoinBalance, _setBitcoinBalance] = useState(balance)
    const [fiatBalance, setFiatBalance] = useState(0)

     useEffect(() => {
      async function updateFiatPrice() {
         const btcPrice = await fetchBtcPrice()
         if (btcPrice) {
            setFiatBalance(bitcoinBalance * btcPrice)
         }
      }

      updateFiatPrice()

      const interval = setInterval(() => {
         updateFiatPrice()
      }, 60_000)

      return () => clearInterval(interval)
    }, [bitcoinBalance])

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
                     {visibleBalance ? new Intl.NumberFormat("en", {maximumFractionDigits: 8}).format(bitcoinBalance) : '****'}
                  </span>
               </div>
           </div>
        </div>
    )
};