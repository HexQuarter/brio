import { useTranslation } from 'react-i18next';

import { FiEye, FiSettings } from "react-icons/fi";

import { WalletBalance } from '@/components/wallet/WalletBalance';
import { WelcomeWallet } from '@/components/wallet/Welcome';
import { WalletReceive } from '@/components/wallet/WalletReceive';

import { Routes, Route, Outlet } from 'react-router-dom';
import { WalletMenu } from '@/components/wallet/Menu';

import { useState } from 'react';

export const WalletMainPage = () => {
  const [visibleBalance, setVisibleBalance] = useState(true)

  return (
    <div className="flex flex-col gap-5 h-full">
        <div className="flex gap-10 items-end justify-between">
            <WalletBalance visibleBalance={visibleBalance}/>
            <div className='flex gap-4 mb-3'>
                <FiEye className='text-gray-400' onClick={() => setVisibleBalance(!visibleBalance)}/>
                <FiSettings className='text-gray-400' />
            </div>
        </div>
        <div className="bg-gray-100 p-5 rounded-xl flex-1 flex flex-col">
            <div className="flex flex-col gap-20 items-center mt-5">
                <WalletMenu />
                <Outlet />
            </div>
        </div>
    </div>
  );
};