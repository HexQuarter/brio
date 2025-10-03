// import { t } from 'i18next';
import { convertSatsToBtc, formatBtcAmount, formatFiatAmount } from '@/helpers/number';
import { useWallet } from '@/lib/useWallet';
import { shortenAddress } from '@/lib/utils';
import { Payment } from '@breeztech/breez-sdk-liquid/web';
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Spinner } from '@telegram-apps/telegram-ui';

export const WalletActivityDetails : React.FC = () => {
    const {t} = useTranslation()
    const { breezSdk, currency} = useWallet()
    const { txid } = useParams()
    const navigate = useNavigate()

    const [payment, setPayment] = useState<undefined | Payment>(undefined)
    const [price, setPrice] = useState(0)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const loadingPayments = async () => {
            if (breezSdk) {
                const fiatRates = await breezSdk.fetchFiatRates()
                const rate = fiatRates.find(r => r.coin.toLowerCase() == currency.toLowerCase())
                if (rate) {
                    setPrice(rate.value)
                    const payment = await breezSdk.getPayment({
                        type: 'paymentHash', 
                        paymentHash: txid as string
                    })
                    
                    setPayment(payment)
                    setLoading(false)
                }
            }
        }

        loadingPayments()
    }, [breezSdk])

    return (
        <div className="flex flex-col gap-10 w-full h-full ">
            <div className='flex gap-2 items-center'>
                <ArrowLeft onClick={() => navigate('/wallet/activity')} />
                <h3 className="text-2xl font-medium">Transfer info</h3>
            </div>

            { loading && <Spinner size='s'/>}
            { !loading && payment &&
                <div className='flex flex-col gap-5 h-full text-left bg-white p-5 rounded-sm'>
                    <div className='flex justify-between'>
                        <span>
                            { payment.paymentType == 'send' && <span>{t('walletActivity.spendBtcTitle')}</span>}
                            { payment.paymentType == 'receive' && <span>{t('walletActivity.receiveBtcTitle')}</span>}
                        </span>
                        <Badge variant={payment.status == 'complete' ? 'default' : payment.status == 'failed' ? 'destructive' : 'outline'}>
                            {t(`walletActivity.status.${payment.status}`)}
                        </Badge>
                    </div>
                    
                    <div className='flex flex-col gap-2'>
                        { payment.paymentType == 'receive' &&
                            <div className='flex justify-between'>
                                <span className='text-gray-400'>{t('walletActivity.destination')}</span>
                                <span>{shortenAddress(payment.destination as string)}</span>
                            </div>
                        }
                        <div className='flex justify-between'>
                            <span className='text-gray-400'>{t('walletActivity.fees')}</span>
                            <span className='items-center'>
                                {formatBtcAmount(convertSatsToBtc(payment.feesSat))} BTC 
                                <span className='text-xs'> / {formatFiatAmount(price*convertSatsToBtc(payment.feesSat))} {currency}</span>
                            </span>
                        </div>
                        <div className='flex justify-between'>
                            <span className='text-gray-400'>{t('walletActivity.date')}</span>
                            <span>{new Date(payment.timestamp * 1000).toLocaleString()}</span>
                        </div>
                         <div className='flex justify-between'>
                            <span className='text-gray-400'>{t('walletActivity.amount')}</span>
                            <div className={`flex flex-col gap-1 ${payment.paymentType == 'send' ? 'text-red-600' : 'text-green-600'}`}>
                                <span>{payment.paymentType == 'send' ? '-' : '+'}{formatBtcAmount(convertSatsToBtc(payment.feesSat))} BTC</span>
                                <span>{payment.paymentType == 'send' ? '-' : '+'}{formatFiatAmount(price*convertSatsToBtc(payment.feesSat))} {currency}</span>
                            </div>
                        </div>
                    </div>
                </div>
            }
        </div>
    )
}