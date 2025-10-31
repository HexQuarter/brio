import { WalletBalance } from '@/components/wallet/WalletBalance';

import { Outlet } from 'react-router-dom';
import { WalletMenu } from '@/components/wallet/Menu';
import { useWallet } from '@/lib/wallet/context';

import { useEffect, useState } from 'react';
import { convertSatsToBtc } from '@/helpers/number';
import { Spinner } from '@telegram-apps/telegram-ui';
import { BreezSdk } from '@breeztech/breez-sdk-spark/web';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CiCircleAlert } from "react-icons/ci";
import { fetchPrice } from '@/lib/wallet/api';

export const WalletMainPage = () => {
    const { breezSdk, currency } = useWallet()
    const [btcBalance, setBtcBalance] = useState(0)
    const [fiatBalance, setFiatBalance] = useState(0)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")
    const [price, setPrice] = useState(0)

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
            catch(e) {
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

    //  if (!walletExists && location.search == '?visit') {
    //     return (
    //         <Page back={true}>
    //             <div className="bg-gray-100 p-5 rounded-xl flex-1 flex flex-col">
    //                 <div className="p-5 bg-white rounded-xl flex-1">
    //                     <div className='flex flex-col gap-5'>
    //                         <div className="flex flex-col gap-10">
    //                             <div className="flex flex-col gap-10">
    //                                 <h3 className='text-2xl font-medium'>{t('main.nowalletTitle')}</h3>
    //                                 <p>{t('main.nowalletDescription_1')}</p>
    //                                 <p>{t('main.nowalletDescription_2')}</p>
    //                                 <p>{t('main.nowalletDescription_3')}</p>
    //                             </div>
    //                             <div className="flex flex-col gap-5 items-center">
    //                                 <Button className="w-full" onClick={() => navigate('/onboarding/create-wallet')}>{t('main.createButton')}</Button>
    //                                 <Button variant="secondary" className="w-full" onClick={() => navigate('/onboarding/restore-wallet')}>{t('main.restoreButton')}</Button>
    //                             </div>
    //                         </div>
    //                     </div>
    //                 </div>
    //             </div>
    //         </Page>
    //     )
    // }

    return (
        <div className='flex flex-col h-full'>
            { loading && <div className="flex flex-col items-center "><Spinner size='l' /></div>}
            { !loading && !error && 
                <div className="flex flex-col gap-5 h-full ">
                    {loading && <Spinner size='s' />}
                    <WalletBalance btcBalance={btcBalance} fiatBalance={fiatBalance} currency={currency}/>
                        <div className="bg-gray-100 p-1 rounded-xl flex-1 flex flex-col">
                            <div className="flex flex-col gap-20 mt-5 p-2">
                                <WalletMenu />
                                <Outlet context={[btcBalance]}/>
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