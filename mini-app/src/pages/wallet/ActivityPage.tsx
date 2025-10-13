// import { t } from 'i18next';
import { convertSatsToBtc, formatBtcAmount, formatFiatAmount, timeAgo } from '@/helpers/number';
import { useWallet } from '@/lib/walletContext';
import { Payment } from '@breeztech/breez-sdk-spark';
import { Spinner } from '@telegram-apps/telegram-ui';
import { InfoIcon } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

export type FormattedPayment = {
        fiatAmount: string
        btcAmount: string
        btcFee: string
        fiatFee: string
    } & Payment

export const WalletActivityPage : React.FC = () => {
    const { t } = useTranslation()
    const { breezSdk, currency} = useWallet()
    const navigate = useNavigate()
    const [loading, setLoading] = useState(true)
    const [payments, setPayments] = useState<any[]>([])

    useEffect(() => {
        const loadingPayments = async () => {
            if (breezSdk) {
                const fiatRates = await breezSdk.listFiatRates()
                const rate = fiatRates.rates.find(r => r.coin.toLowerCase() == currency.toLocaleLowerCase())
                if (rate) {
                    const price = rate.value
                    const payments = await breezSdk.listPayments({})
                    setPayments(payments.payments.map((payment: Payment) => {
                        const rawBtcAmount = convertSatsToBtc(payment.amount)
                        const feeBtcAmount = convertSatsToBtc(payment.fees)
                        const formattedPayment = payment as FormattedPayment
                        formattedPayment.fiatAmount = formatFiatAmount(rawBtcAmount * price)
                        formattedPayment.btcAmount = formatBtcAmount(rawBtcAmount)
                        formattedPayment.fiatFee = formatFiatAmount(feeBtcAmount * price)
                        formattedPayment.btcFee = formatBtcAmount(feeBtcAmount)
                        return formattedPayment
                    }))
                    setLoading(false)
                }
            }
        }

        loadingPayments()

        const interval = setInterval(() => {
            loadingPayments()
        }, 2000);
        
        return () => clearInterval(interval);

    }, [breezSdk])

    return (
        <div className="flex flex-col gap-5 text-center w-full h-full rounded-sm">
            <h3 className="text-2xl font-medium">{t('walletActivity.title')}</h3>
            <div className='flex flex-col p-2'>
                {loading && <Spinner size='s'/>}
                {!loading && payments.map((payment: FormattedPayment) => (
                    <div className='border-gray-300 flex flex-col p-3 border-b-1 active:bg-white hover:bg-white' key={payment.id} onClick={() => navigate(`${payment.id}`)}>
                        <div className='flex items-center justify-between text-left' >
                            <div className={`flex gap-2 ${payment.paymentType == 'send' ? 'text-red-800' : 'text-green-800'}`}>
                                <span className='w-20'>
                                    { payment.paymentType == 'receive' && 'Received'}
                                    { payment.paymentType == 'send' && 'Sent'}
                                </span>
                                <div className='flex flex-col'>
                                    <span>{payment.btcAmount} BTC</span>
                                    <div className='flex text-left text-xs text-gray-400'>
                                        <span>{payment.fiatAmount} {currency} - {timeAgo(payment.timestamp * 1000)}</span>
                                    </div>
                                    <div className=''>
                                        {payment.status == 'pending' &&
                                            <span className='text-xs text-orange-300'>{t('walletActivity.status.pending')}</span>
                                        }
                                        {payment.status == 'failed' &&
                                            <span className='text-xs text-orange-300'>{t('walletActivity.status.failed')}</span>
                                        }
                                    </div>
                                </div>
                            </div>
                        <InfoIcon className='text-gray-400' onClick={() => navigate(`${payment.id}`)}/>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}