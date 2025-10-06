// import { t } from 'i18next';
import { useWallet } from '@/lib/useWallet';
import { shortenAddress } from '@/lib/utils';
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { FormattedPayment } from './WalletActivity';
import { LuCopy } from 'react-icons/lu';
import { toast } from 'sonner';

export const WalletActivityDetails : React.FC = () => {
    const {t} = useTranslation()
    const location = useLocation()
    const { currency} = useWallet()
    const navigate = useNavigate()

    const [payment, setPayment] = useState<undefined | FormattedPayment>(undefined)

    useEffect(() => {
        const urlParams = new URLSearchParams(location.search)
        if (urlParams && urlParams.has('payment')) {
            const payment = JSON.parse(urlParams.get('payment') as string) as FormattedPayment
            console.log(payment)
            setPayment(payment)
        }

    }, [location])

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
                        <Badge variant={payment.status == 'complete' ? 'default' : payment.status == 'failed' ? 'destructive' : 'warning'}>
                            {t(`walletActivity.status.${payment.status}`)}
                        </Badge>
                    </div>
                    
                    <div className='flex flex-col gap-2'>
                        {payment.details.type == 'bitcoin' &&
                            <>
                                <div className='flex justify-between'>
                                    <span className='text-gray-400'>{t('walletActivity.address')}</span>
                                    <span className='flex gap-2'>
                                        {shortenAddress(payment.details.bitcoinAddress)}
                                        <div className="active:text-primary"><LuCopy className='w-5 h-5' onClick={() => copy((payment.details as any).bitcoinAddress as string)}/></div>
                                    </span>
                                </div>
                                 <div className='flex justify-between'>
                                    <span className='text-gray-400'>{t('walletActivity.transaction')}</span>
                                    <span className='flex gap-2'>
                                        {shortenAddress(payment.details.lockupTxId as string)}
                                        <div className="active:text-primary"><LuCopy className='w-5 h-5' onClick={() => copy((payment.details as any).lockupTxId as string)} /></div>
                                    </span>
                                </div>
                            </>
                        }
                        {payment.details.type == 'lightning' && 
                            <div className='flex justify-between'>
                                <span className='text-gray-400'>{t('walletActivity.offer')}</span>
                                <span className='flex gap-2'>
                                    {shortenAddress(payment.destination as string)}
                                    <div className="active:text-primary"><LuCopy className='w-5 h-5' onClick={() => copy(payment.destination as string)} /></div>
                                </span>
                            </div>
                        }
                        {payment.details.type == 'lightning' &&
                            <div className='flex justify-between'>
                                <span className='text-gray-400'>{t('walletActivity.publicKey')}</span>
                                <span className='flex gap-2'>
                                    {shortenAddress(payment.details.destinationPubkey as string)}
                                    <div className="active:text-primary"><LuCopy className='w-5 h-5' onClick={() => copy((payment.details as any).destinationPubkey as string)} /></div>
                                </span>
                            </div>
                        }
                        <div className='flex justify-between'>
                            <span className='text-gray-400'>{t('walletActivity.fees')}</span>
                            <span className='items-center'>
                                {payment.btcFee} BTC 
                                <span className='text-xs'> / {payment.fiatFee} {currency}</span>
                            </span>
                        </div>
                        <div className='flex justify-between'>
                            <span className='text-gray-400'>{t('walletActivity.date')}</span>
                            <span>{new Date(payment.timestamp * 1000).toLocaleString()}</span>
                        </div>
                            <div className='flex justify-between'>
                            <span className='text-gray-400'>{t('walletActivity.amount')}</span>
                            <div className={`flex flex-col gap-1 ${payment.paymentType == 'send' ? 'text-red-600' : 'text-green-600'}`}>
                                <span>{payment.paymentType == 'send' ? '-' : '+'}{payment.btcAmount} BTC</span>
                                <span>{payment.paymentType == 'send' ? '-' : '+'}{payment.fiatAmount} {currency}</span>
                            </div>
                        </div>
                    </div>
                </div>
            }

        </div>
    )
}