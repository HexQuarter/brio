import { WalletBalance } from '@/components/wallet/WalletBalance';

import { Outlet } from 'react-router-dom';
import { Menu } from '@/components/Menu';
import { useWallet } from '@/lib/wallet/context';

import { useEffect, useState } from 'react';
import { convertSatsToBtc } from '@/helpers/number';
import { Spinner } from '@telegram-apps/telegram-ui';
import { BreezSdk } from '@breeztech/breez-sdk-spark/web';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CiCircleAlert } from "react-icons/ci";
import { fetchPrice } from '@/lib/wallet/api';

import { GoDownload, GoHistory, GoUpload } from "react-icons/go"
import { t } from 'i18next';

export const WalletMainPage = () => {
    const { breezSdk, currency } = useWallet()
    const [btcBalance, setBtcBalance] = useState(0)
    const [fiatBalance, setFiatBalance] = useState(0)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")
    const [price, setPrice] = useState(0)

    const menuItems = [
        {
            name: t('wallet.menuReceiveBTC'),
            icon: GoDownload,
            path: '/app/wallet/receive',
        },
        {
            name: t('wallet.menuSendBTC'),
            icon: GoUpload,
            path: '/app/wallet/send',
        },
        {
            name: t('wallet.menuActivity'),
            icon: GoHistory,
            path: '/app/wallet/activity',
        }
    ]

    useEffect(() => {
        const refreshPrice = async () => {
            const price = await fetchPrice(currency)
            setPrice(price)
        }

        refreshPrice()

        const interval = setInterval(async () => await refreshPrice(), 5000)
        return () => clearInterval(interval)
    }, [currency])

    useEffect(() => {
        const loadBalance = async (breezSdk: BreezSdk, ensureSync: boolean = false) => {
            try {
                const walletInfo = await breezSdk.getInfo({
                    // ensureSynced: true will ensure the SDK is synced with the Spark network
                    // before returning the balance
                    ensureSynced: ensureSync,
                })
                const btc = convertSatsToBtc(walletInfo.balanceSats)
                setBtcBalance(btc)
                setFiatBalance(btc * price)
            }
            catch (e) {
                setError((e as Error).message)
            }
            finally {
                setLoading(false)
            }
        }

        if (breezSdk) {
            loadBalance(breezSdk)

            const interval = setInterval(async () => await loadBalance(breezSdk, true), 1000)
            return () => clearInterval(interval)
        }

    }, [breezSdk, currency, price])

    return (
        <div className='flex flex-col h-full'>
            {loading && <div className="flex flex-col items-center "><Spinner size='l' /></div>}
            {!loading && !error &&
                <div className="flex flex-col gap-5 h-full ">
                    {loading && <Spinner size='s' />}
                    <WalletBalance btcBalance={btcBalance} fiatBalance={fiatBalance} currency={currency} />
                    <div className="bg-gray-100 p-1 rounded-xl flex-1 flex flex-col">
                        <div className="flex flex-col gap-20 mt-5 p-2">
                            <Menu items={menuItems} />
                            <Outlet context={[btcBalance]} />
                        </div>
                    </div>
                </div>
            }
            {error &&
                <Alert variant="destructive">
                    <CiCircleAlert />
                    <AlertTitle>Something went wrong !</AlertTitle>
                    <AlertDescription>
                        <p>Please try again by refreshing the page.</p>
                        <p>If the problem persists, wait a few minutes and try again later.</p>

                        <p className='mt-10'>Cause: {error}</p>
                    </AlertDescription>
                </Alert>
            }
        </div>
    );
};