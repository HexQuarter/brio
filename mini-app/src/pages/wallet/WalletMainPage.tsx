import { WalletBalance } from '@/components/wallet/WalletBalance';

import {  Outlet } from 'react-router-dom';
import { WalletMenu } from '@/components/wallet/Menu';
import { useWallet } from '@/lib/useWallet';

import { useEffect, useState } from 'react';
import { BindingLiquidSdk } from '@breeztech/breez-sdk-liquid/web';

export const WalletMainPage = () => {
    const { breezSdk } = useWallet()

    const [balance, setBalance] = useState(0)

    useEffect(() => { 
        if (breezSdk) {
            const loadBalance = async (sdk: BindingLiquidSdk) => {
                const walletInfo = await sdk.getInfo()
                setBalance(walletInfo.walletInfo.balanceSat)
            }
            loadBalance(breezSdk)
        }
    }, [breezSdk])

  return (
    <div className="flex flex-col gap-5 h-full pb-10">
        <WalletBalance  balance={balance} />
        <div className="bg-gray-100 p-5 rounded-xl flex-1 flex flex-col">
            <div className="flex flex-col gap-20 items-center mt-5">
                <WalletMenu />
                <Outlet />
            </div>
        </div>
    </div>
  );
};