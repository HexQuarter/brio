import { WalletBalance } from '@/components/wallet/WalletBalance';

import {  Outlet } from 'react-router-dom';
import { WalletMenu } from '@/components/wallet/Menu';
import { useWallet } from '@/lib/useWallet';

import { useEffect, useState } from 'react';
import { BindingLiquidSdk } from '@breeztech/breez-sdk-liquid/web';
import { convertSatsToBtc } from '@/helpers/number';

export const WalletMainPage = () => {
    const { breezSdk } = useWallet()

    const [btcBalance, setBtcBalance] = useState(0)
    const [fiatBalance, setFiatBalance] = useState(0)

    useEffect(() => { 

        const loadBalance = async (breezSdk: BindingLiquidSdk) => {
            console.log('syncing...')
            await breezSdk.sync()
            console.log('synched')
            const walletInfo = await breezSdk.getInfo()
            console.log(walletInfo)
            const btc = convertSatsToBtc(walletInfo.walletInfo.balanceSat)
            setBtcBalance(btc)

            const fiatRates = await breezSdk.fetchFiatRates()
            // TODO: select the currency from the settings
            const rate = fiatRates.find(r => r.coin == 'USD')
            if (rate) {
                setFiatBalance(btc * rate.value)
            }
        }

        if (breezSdk) {
            loadBalance(breezSdk)
        }
    }, [breezSdk])

  return (
    <div className="flex flex-col gap-5 h-full pb-10">
        <WalletBalance  btcBalance={btcBalance} fiatBalance={fiatBalance} />
        <div className="bg-gray-100 p-5 rounded-xl flex-1 flex flex-col">
            <div className="flex flex-col gap-20 items-center mt-5">
                <WalletMenu />
                <Outlet />
            </div>
        </div>
    </div>
  );
};