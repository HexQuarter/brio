// import { t } from 'i18next';
import { convertSatsToBtc, formatBtcAmount, formatFiatAmount } from '@/helpers/number';
import { useWallet } from '@/lib/useWallet';
import { shortenAddress } from '@/lib/utils';
import { Payment } from '@breeztech/breez-sdk-liquid/web';
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft } from 'lucide-react';

export const WalletActivityDetails : React.FC = () => {

    const { breezSdk} = useWallet()
    const { txid } = useParams()
    const navigate = useNavigate()

    const [payment, setPayment] = useState<undefined | Payment>(undefined)
    const [price, setPrice] = useState(0)

    useEffect(() => {
        const loadingPayments = async () => {
            if (breezSdk) {
                const fiatRates = await breezSdk.fetchFiatRates()
                // TODO: select the currency from the settings
                const rate = fiatRates.find(r => r.coin == 'USD')
                if (rate) {
                    setPrice(rate.value)
                    const payment = await breezSdk.getPayment({
                        type: 'paymentHash', 
                        paymentHash: txid as string
                    })
                    
                    setPayment(payment)
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
            
            { payment &&
                <div className='flex flex-col gap-5 h-full text-left bg-white p-5 rounded-sm'>
                    <div className='flex justify-between'>
                        <span>
                            { payment.paymentType == 'send' && <span>You sent Bitcoin</span>}
                            { payment.paymentType == 'receive' && <span>You received Bitcoin</span>}
                        </span>
                        <Badge variant={payment.status == 'complete' ? 'default' : payment.status == 'failed' ? 'destructive' : 'outline'}>{payment.status}</Badge>
                    </div>
                    
                    <div className='flex flex-col gap-2'>
                        { payment.paymentType == 'receive' &&
                            <div className='flex justify-between'>
                                <span className='text-gray-400'>To</span>
                                <span>{shortenAddress(payment.destination as string)}</span>
                            </div>
                        }
                        <div className='flex justify-between'>
                            <span className='text-gray-400'>Fees</span>
                            <span className='items-center'>
                                {formatBtcAmount(convertSatsToBtc(payment.feesSat))} BTC 
                                <span className='text-xs'> / {formatFiatAmount(price*convertSatsToBtc(payment.feesSat))} USD</span>
                            </span>
                        </div>
                        <div className='flex justify-between'>
                            <span className='text-gray-400'>Date</span>
                            <span>{new Date(payment.timestamp * 1000).toLocaleString()}</span>
                        </div>
                         <div className='flex justify-between'>
                            <span className='text-gray-400'>Amount</span>
                            <div className={`flex flex-col gap-1 text-${payment.paymentType == 'send' ? 'red' : 'green'}-800`}>
                                <span>{payment.paymentType == 'send' ? '-' : '+'}{formatBtcAmount(convertSatsToBtc(payment.feesSat))} BTC</span>
                                <span>{payment.paymentType == 'send' ? '-' : '+'}{formatFiatAmount(price*convertSatsToBtc(payment.feesSat))} USD</span>
                            </div>
                        </div>
                    </div>
                </div>
            }
        </div>
    )
}