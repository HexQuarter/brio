// import { t } from 'i18next';
import { useWallet } from '@/lib/walletContext';
import { shortenAddress } from '@/lib/utils';
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { LuCopy } from 'react-icons/lu';
import { toast } from 'sonner';
import { Payment } from '@breeztech/breez-sdk-spark/web';
import { convertSatsToBtc, formatBtcAmount, formatFiatAmount } from '@/helpers/number';

export const WalletActivityDetails : React.FC = () => {
    const {t} = useTranslation()
    const {id} = useParams()
    const { breezSdk, currency} = useWallet()
    const navigate = useNavigate()

    const [payment, setPayment] = useState<undefined | Payment>(undefined)
    const [price, setPrice] = useState(0)

    useEffect(() => {
        const loadPayment = async () => {
            const paymentResponse = await breezSdk?.getPayment({ paymentId: id as string })
            const rateResponse = await breezSdk?.listFiatRates()
            const rate = rateResponse?.rates.find(r => r.coin.toLowerCase() == currency.toLowerCase())
            setPayment(paymentResponse?.payment)
            if (!rate) return
            setPrice(rate.value)
        }

        loadPayment()
    }, [breezSdk])

    const copy = async (data: string) => {
        await navigator.clipboard.writeText(data)
        const toastId = toast.info(t('walletActivity.copyToast'))
        setTimeout(() => {
            toast.dismiss(toastId)
        }, 2000)
    }

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
                            { payment.paymentType == 'send' && <span>{t('walletActivity.spendBtcTitle')}</span>}
                            { payment.paymentType == 'receive' && <span>{t('walletActivity.receiveBtcTitle')}</span>}
                        </span>
                        <Badge variant={payment.status == 'completed' ? 'default' : payment.status == 'failed' ? 'destructive' : 'warning'}>
                            {t(`walletActivity.status.${payment.status}`)}
                        </Badge>
                    </div>
                    
                    <div className='flex flex-col gap-2'>
                        {payment.details?.type == 'deposit' &&
                            <>
                                 <div className='flex justify-between'>
                                    <span className='text-gray-400'>{t('walletActivity.transaction')}</span>
                                    <span className='flex gap-2'>
                                        {shortenAddress(payment.details.txId as string)}
                                        <div className="active:text-primary"><LuCopy className='w-5 h-5' onClick={() => copy((payment.details as any).txId as string)} /></div>
                                    </span>
                                </div>
                            </>
                        }
                      
                        {payment.details?.type == 'lightning' &&
                            <div className='flex justify-between'>
                                <span className='text-gray-400'>{t('walletActivity.publicKey')}</span>
                                <span className='flex gap-2'>
                                    {shortenAddress(payment.details.destinationPubkey as string)}
                                    <div className="active:text-primary"><LuCopy className='w-5 h-5' onClick={() => copy((payment.details as any).destinationPubkey as string)} /></div>
                                </span>
                            </div>
                        }
                        {payment.details?.type == 'lightning' && 
                            <div className='flex justify-between'>
                                <span className='text-gray-400'>{t('walletActivity.invoice')}</span>
                                <span className='flex gap-2'>
                                    {shortenAddress(payment.details.invoice as string)}
                                    <div className="active:text-primary"><LuCopy className='w-5 h-5' onClick={() => copy((payment.details as any).invoice as string)} /></div>
                                </span>
                            </div>
                        }
                        { payment.paymentType == 'send' &&
                        <div className='flex justify-between'>
                            <span className='text-gray-400'>{t('walletActivity.fees')}</span>
                            <span className='items-center'>
                                {formatBtcAmount(convertSatsToBtc(payment.fees))} BTC 
                                { price > 0 &&
                                    <span className='text-xs'> / {formatFiatAmount(convertSatsToBtc(payment.fees) * price)} {currency}</span>
                                }
                            </span>
                        </div>}
                        <div className='flex justify-between'>
                            <span className='text-gray-400'>{t('walletActivity.date')}</span>
                            <span>{new Date(payment.timestamp * 1000).toLocaleString()}</span>
                        </div>
                            <div className='flex justify-between'>
                            <span className='text-gray-400'>{t('walletActivity.amount')}</span>
                            <div className={`flex flex-col gap-1 ${payment.paymentType == 'send' ? 'text-red-600' : 'text-green-600'}`}>
                                <span>{payment.paymentType == 'send' ? '-' : '+'}{formatBtcAmount(convertSatsToBtc(payment.amount))} BTC</span>
                                { price > 0 &&
                                    <span>{payment.paymentType == 'send' ? '-' : '+'}{formatFiatAmount(convertSatsToBtc(payment.amount) * price)} {currency}</span>
                                }
                            </div>
                        </div>
                    </div>
                </div>
            }
        </div>
    )
}