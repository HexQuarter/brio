import { WalletBalance } from '@/components/wallet/WalletBalance';

import {  Outlet, useLocation, useNavigate } from 'react-router-dom';
import { WalletMenu } from '@/components/wallet/Menu';
import { useWallet } from '@/lib/walletContext';

import { useEffect, useState } from 'react';
import { convertSatsToBtc } from '@/helpers/number';
import { Spinner } from '@telegram-apps/telegram-ui';
import { BreezSdk } from '@breeztech/breez-sdk-spark/web';
import { retrieveLaunchParams } from '@telegram-apps/sdk-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CiCircleAlert } from "react-icons/ci";
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import { UnlockWalletPage } from './UnlockWalletPage';

export const WalletMainPage = () => {
    const { breezSdk, currency, walletExists, promptForPassword } = useWallet()
    const location = useLocation()
    const navigate = useNavigate()
    const {t} = useTranslation()
    const [btcBalance, setBtcBalance] = useState(0)
    const [fiatBalance, setFiatBalance] = useState(0)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")
    
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

                const fiatRates = await breezSdk.listFiatRates()
                const rate = fiatRates.rates.find(r => r.coin.toLowerCase() == currency.toLocaleLowerCase())
                if (rate) {
                    setFiatBalance(btc * rate.value)
                }
            }
            catch(e) {
                setError((e as Error).message)
            }
            finally {
                setLoading(false)
            }
        }

        if (breezSdk) {
            const tgData = retrieveLaunchParams()
            if (tgData) {
                const startParam = tgData.tgWebAppData?.start_param
                if (startParam) {
                    const params = new URLSearchParams(startParam)
                    const paymentHash = params.get('payment')
                    if (paymentHash) {
                        const fetchPaymentId = async (hash: string) => {
                            const { payments } = await breezSdk.listPayments({})
                            const payment = payments.find(p => p.paymentType == 'receive' && p.details?.type == 'lightning' && p.details.paymentHash == hash)
                            if (payment) {
                                navigate(`/wallet/activity/${payment.id}`)
                            }
                        }

                        fetchPaymentId(paymentHash)
                    }
                }
            }

            loadBalance(breezSdk)
            
            const interval = setInterval(async () => await loadBalance(breezSdk, true), 1000)
            return () => clearInterval(interval)
        }

    }, [breezSdk, currency])

     if (!walletExists && location.search == '?visit') {
        return (
            <div className="bg-gray-100 p-5 rounded-xl flex-1 flex flex-col">
                <div className="p-5 bg-white rounded-xl flex-1">
                    <div className='flex flex-col gap-5'>
                        <div className="flex flex-col gap-10">
                            <div className="flex flex-col gap-10">
                                <h3 className='text-2xl font-medium'>{t('main.nowalletTitle')}</h3>
                                <p>{t('main.nowalletDescription_1')}</p>
                                <p>{t('main.nowalletDescription_2')}</p>
                                <p>{t('main.nowalletDescription_3')}</p>
                            </div>
                            <div className="flex flex-col gap-5 items-center">
                                <Button className="w-40" onClick={() => navigate('/onboarding/create-wallet')}>{t('main.createButton')}</Button>
                                <Button variant="secondary" className="w-40" onClick={() => navigate('/onboarding/restore-wallet')}>{t('main.restoreButton')}</Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    if (walletExists && promptForPassword) {
        return <UnlockWalletPage />
    }

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
                                <Outlet />
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