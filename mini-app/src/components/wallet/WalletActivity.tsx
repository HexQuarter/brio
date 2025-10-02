// import { t } from 'i18next';
import { convertSatsToBtc, formatBtcAmount, formatFiatAmount, timeAgo } from '@/helpers/number';
import { useWallet } from '@/lib/useWallet';
import { Payment } from '@breeztech/breez-sdk-liquid/web';
import { InfoIcon } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export const WalletActivity : React.FC = () => {

    const { breezSdk, currency} = useWallet()
    const navigate = useNavigate()

    const [payments, setPayments] = useState<any[]>([])

    useEffect(() => {
        const loadingPayments = async () => {
            console.log(breezSdk)
            if (breezSdk) {
                const fiatRates = await breezSdk.fetchFiatRates()
                const rate = fiatRates.find(r => r.coin.toLowerCase() == currency.toLocaleLowerCase())
                if (rate) {
                    const price = rate.value
                    const payments = await breezSdk.listPayments({})
                    setPayments(payments.map((payment: Payment) => {
                        const rawBtcAmount = convertSatsToBtc(payment.amountSat)
                        return {
                            type: payment.paymentType,
                            status: payment.status,
                            amount: formatBtcAmount(rawBtcAmount),
                            fiatAmount: formatFiatAmount(rawBtcAmount * price),
                            txid: payment.txId,
                            hash: ((payment.details) as any).paymentHash,
                            timestamp: payment.timestamp
                        }
                    }))
                }
            }
        }

        loadingPayments()

        const interval = setInterval(() => {
            loadingPayments()
        }, 1000);
        
        return () => clearInterval(interval);

    }, [breezSdk])

    return (
        <div className="flex flex-col gap-5 text-center w-full h-full rounded-sm">
            <h3 className="text-2xl font-medium">Wallet Activity</h3>
            <div className='flex flex-col p-2 gap-2'>
                {payments.map((payment: any) => (
                    <div className='border-b-1 border-gray-100 flex flex-col p-3 bg-white rounded-sm shadow-xs' key={payment.hash}>
                        <div className='flex items-center justify-between text-left' key={payment.txid}>
                            <div className={`flex gap-2 text-${payment.type == 'send' ? 'red' : 'green'}-800`}>
                                <span>
                                    { payment.type == 'receive' && 'Received'}
                                    { payment.type == 'send' && 'Sent'}
                                </span>
                                <div className='flex flex-col'>
                                    <span>{payment.amount} BTC</span>
                                    <div className='flex text-left text-xs text-gray-400'>
                                        <span>{payment.fiatAmount} {currency} - {timeAgo(payment.timestamp * 1000)}</span>
                                    </div>
                                    <div className=''>
                                        {payment.status == 'pending' &&
                                            <span className='text-xs text-orange-300'>Pending</span>
                                        }
                                    </div>
                                </div>
                            </div>
                            <InfoIcon className='text-gray-400' onClick={() => navigate(`${payment.hash}`)}/>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}