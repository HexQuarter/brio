import { WalletBalance } from '@/components/wallet/WalletBalance';

import {  Outlet, useNavigate } from 'react-router-dom';
import { WalletMenu } from '@/components/wallet/Menu';
import { useWallet } from '@/lib/walletContext';

import { useEffect, useState } from 'react';
import { convertSatsToBtc } from '@/helpers/number';
import { Spinner } from '@telegram-apps/telegram-ui';
import { BreezSdk } from '@breeztech/breez-sdk-spark/web';
import { retrieveLaunchParams } from '@telegram-apps/sdk-react';

export const WalletMainPage = () => {
    const { breezSdk, currency } = useWallet()
    
    const [btcBalance, setBtcBalance] = useState(0)
    const [fiatBalance, setFiatBalance] = useState(0)
    const [loading, setLoading] = useState(true)
    const navigate = useNavigate()

    useEffect(() => { 
        const loadBalance = async (breezSdk: BreezSdk, ensureSync: boolean = false) => {
            const walletInfo = await breezSdk.getInfo({
                // ensureSynced: true will ensure the SDK is synced with the Spark network
                // before returning the balance
                ensureSynced: ensureSync,
            })
            const btc = convertSatsToBtc(walletInfo.balanceSats)
            setBtcBalance(btc)

            const fiatRates = await breezSdk.listFiatRates()
            const rate = fiatRates.rates.find(r => r.coin.toLowerCase() == currency.toLocaleLowerCase())
            if (rate) {
                setFiatBalance(btc * rate.value)
            }

            setLoading(false)
        }

        if (breezSdk) {
            loadBalance(breezSdk)
            
            const interval = setInterval(async () => await loadBalance(breezSdk, true), 1000)
            return () => clearInterval(interval)
        }

        const tgData = retrieveLaunchParams()
        if (tgData) {
            const startParam = tgData.tgWebAppData?.start_param
            if (startParam) {
                const params = new URLSearchParams(startParam)
                const payment = params.get('payment')
                if (payment) {
                    navigate(`/wallet/activity/${payment}`)
                }
            }
        }

    }, [breezSdk, currency])

  return (
        <div className='flex flex-col h-full'>
            { loading && <div className="flex flex-col items-center "><Spinner size='l' /></div>}
            { !loading && 
                <div className="flex flex-col gap-5 h-full ">
                    {loading && <Spinner size='s' />}
                    <WalletBalance btcBalance={btcBalance} fiatBalance={fiatBalance} currency={currency}/>
                        <div className="bg-gray-100 p-1 rounded-xl flex-1 flex flex-col">
                            <div className="flex flex-col gap-20 items-center mt-5 p-2">
                                <WalletMenu />
                                <Outlet />
                            </div>
                        </div>
                </div>
            }
        </div>
  );
};