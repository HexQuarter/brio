import { WalletBalance } from '@/components/wallet/WalletBalance';

import {  Outlet } from 'react-router-dom';
import { WalletMenu } from '@/components/wallet/Menu';
import { useWallet } from '@/lib/useWallet';

import { useEffect, useState } from 'react';
import { BindingLiquidSdk } from '@breeztech/breez-sdk-liquid/web';
import { convertSatsToBtc } from '@/helpers/number';
import { Spinner } from '@telegram-apps/telegram-ui';

export const WalletMainPage = () => {
    const { breezSdk, currency } = useWallet()    
    
    const [btcBalance, setBtcBalance] = useState(0)
    const [fiatBalance, setFiatBalance] = useState(0)
    const [loading, setLoading] = useState(true)

    useEffect(() => { 
        const loadBalance = async (breezSdk: BindingLiquidSdk) => {
            const walletInfo = await breezSdk.getInfo()
            const btc = convertSatsToBtc(walletInfo.walletInfo.balanceSat)
            setBtcBalance(btc)

            const fiatRates = await breezSdk.fetchFiatRates()
            const rate = fiatRates.find(r => r.coin.toLowerCase() == currency.toLocaleLowerCase())
            if (rate) {
                setFiatBalance(btc * rate.value)
            }
        }

        if (breezSdk) {
            loadBalance(breezSdk)
            setLoading(false)

            const interval = setInterval(async () => await loadBalance(breezSdk), 1000)
            return () => clearInterval(interval)
        }
    }, [breezSdk, currency])

  return (
    <div className="flex flex-col gap-5 h-full pb-10">
        {loading && <Spinner size='s' />}
        <WalletBalance btcBalance={btcBalance} fiatBalance={fiatBalance} currency={currency}/>
        <div className="bg-gray-100 p-5 rounded-xl flex-1 flex flex-col">
            <div className="flex flex-col gap-20 items-center mt-5">
                <WalletMenu />
                <Outlet />
            </div>
        </div>
    </div>
  );
};