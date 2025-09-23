import React, {useState} from 'react';
import { useTranslation } from 'react-i18next';
import { BsCurrencyBitcoin } from "react-icons/bs";
import { PiCurrencyDollarBold } from "react-icons/pi";


export const WalletBalance: React.FC = () => {
    const { t } = useTranslation();

    const [bitcoinBalance, setBitcoinBalance] = useState(0.0001)
    const [fiatBalance, setFiatBalance] = useState(1000)

    return (
        <div className="flex flex-col">
           <p className='text-gray-400'>Total balance</p>
           <div className='flex gap-5'>
                <div className="flex gap-2 items-center">
                 <PiCurrencyDollarBold className='text-primary text-3xl'/>
                 <span className="text-3xl font-medium">{fiatBalance}</span>
              </div>
              <div className="w-1 border-r-3 border-primary mt-2 mb-2"></div>
              <div className="flex gap-2 items-center">
                 <BsCurrencyBitcoin className='text-primary text-3xl'/>
                 <span className="text-3xl font-medium">{bitcoinBalance}</span>
              </div>
           </div>
        </div>
    )
};