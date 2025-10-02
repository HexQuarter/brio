// import { t } from 'i18next';
import { convertSatsToBtc, formatBtcAmount, formatFiatAmount } from '@/helpers/number';
import { useWallet } from '@/lib/useWallet';
import { Payment } from '@breeztech/breez-sdk-liquid/web';
import { InfoIcon } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export const WalletActivity : React.FC = () => {

    const { breezSdk} = useWallet()
    const navigate = useNavigate()

    const [payments, setPayments] = useState<any[]>([])

    useEffect(() => {
        const loadingPayments = async () => {
            if (breezSdk) {
                const fiatRates = await breezSdk.fetchFiatRates()
                // TODO: select the currency from the settings
                const rate = fiatRates.find(r => r.coin == 'USD')
                if (rate) {
                    const price = rate.value
                    const payments = await breezSdk.listPayments({})
                    setPayments(payments.map((payment: Payment) => {
                        const rawBtcAmount = convertSatsToBtc(payment.amountSat)
                        return {
                            type: payment.paymentType,
                            amount: formatBtcAmount(rawBtcAmount),
                            fiatAmount: formatFiatAmount(rawBtcAmount * price),
                            status: payment.status,
                            txid: payment.txId,
                            hash: ((payment.details) as any).paymentHash
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
        <div className="flex flex-col gap-10 text-center w-full h-full  bg-white p-5 rounded-sm">
            <h3 className="text-2xl font-medium">WalletActivity</h3>

            <div className='flex flex-col gap-5 h-full '>
                {payments.map((payment: any) => (
                    <div className='flex items-center justify-between gap-5 text-left bg-gray-100 p-2 rounded-sm' key={payment.txid}>
                        <div className='flex gap-5'>
                            <span>
                                { payment.type == 'receive' && 'Received'}
                                { payment.type == 'send' && 'Sent'}
                            </span>
                            <span>{payment.amount} BTC</span>
                        </div>
                        <InfoIcon className='text-gray-400' onClick={() => navigate(`${payment.hash}`)}/>
                    </div>
                ))}
            </div>
        </div>
    )
}