import { t } from 'i18next';
import React, { useEffect, useState } from 'react';
import { Tabs, TabsList, TabsContent, TabsTrigger } from '@/components/ui/tabs';

import { LuShare2, LuCopy } from "react-icons/lu";
import QRCode from "react-qr-code";
import { useWallet } from '@/lib/useWallet';
import { toast } from "sonner"
import { Switch } from '@/components/ui/switch';
import { Bolt11Form } from './Bolt11Form';
import { convertSatsToBtc, formatFiatAmount } from '@/helpers/number';

const shorten = (data: string) => {
    return `${data.slice(0, 6)}...${data.slice(data.length-6, data.length)}`
}

export const WalletReceive : React.FC = () => {
    const { getBtcAddress, getBolt12Offer, breezSdk, currency  } = useWallet()

    const [btcAddress, setBtcAddress] = useState<string | undefined>(undefined)
    const [bolt12Offer, setBolt12Offer] = useState<string | undefined>(undefined)
    const [generateBolt11, setGenerateBolt11] = useState(false)
    const [bolt11Invoice, setBolt11Invoice] = useState<string | undefined>(undefined)
    const [minLn, setMinLn] = useState(0)
    const [maxLn, setMaxLn] = useState(0)
    const [minBtc, setMinBtc] = useState(0)
    const [maxBtc, setMaxBtc] = useState(0)
    const [price, setPrice] = useState(0)

    useEffect(() => {
        if (!breezSdk) {
            return
        }

        const loadOfferAndAddress = async () => {
            const bolt12Offer = await getBolt12Offer(breezSdk)
            if (bolt12Offer) {
                const fiatRates = await breezSdk.fetchFiatRates()
                if (!fiatRates) return
                const rate = fiatRates.find(r => r.coin.toLowerCase() == currency.toLowerCase())
                if (!rate) return
                setPrice(rate.value)
                const currentLimits = await breezSdk.fetchLightningLimits()
                setMinLn(currentLimits.receive.minSat)
                setMaxLn(currentLimits.receive.maxSat)
                setBolt12Offer(bolt12Offer)
            }

            const btcAddress = await getBtcAddress(breezSdk)
            if (btcAddress) {
                const fiatRates = await breezSdk.fetchFiatRates()
                if (!fiatRates) return
                const rate = fiatRates.find(r => r.coin.toLowerCase() == currency.toLowerCase())
                if (!rate) return
                setPrice(rate.value)
                const currentLimits = await breezSdk.fetchOnchainLimits()
                setMinBtc(currentLimits.receive.minSat)
                setMaxBtc(currentLimits.receive.maxSat)
                setBtcAddress(btcAddress)
            }
        }
        loadOfferAndAddress()
    }, [breezSdk])

    const copyLightningInvoice = async () => {
        bolt12Offer && await navigator.clipboard.writeText(bolt12Offer)
        const toastId = toast.info(t('wallet.receive.copyLnToast'))
        setTimeout(() => toast.dismiss(toastId), 2000)
    }

    const shareLightningInvoice = async () => {
        bolt12Offer && await navigator.share({ text: bolt12Offer })
    }

    const copyBitcoinAddress = async () => {
        btcAddress && await navigator.clipboard.writeText(btcAddress)
        const toastId = toast.info(t('wallet.receive.copyBtcToast'))
        setTimeout(() => toast.dismiss(toastId), 2000)
    }

    const shareBitcoinAddress = async () => {
        btcAddress && await navigator.share({ text: btcAddress })
    }

    const handleBolt11Loading = async () => {
        setBolt11Invoice(undefined)
    }

    return (
        <div className="flex flex-col gap-10 text-center">
            <p className="text-primary">{t('wallet.receiveTitle')}</p>
            <Tabs defaultValue="lightning">
                <TabsList>
                    <TabsTrigger value="lightning">{t('wallet.receive.lightningTitle')}</TabsTrigger>
                    <TabsTrigger value="btc">{t('wallet.receive.btcTitle')}</TabsTrigger>
                </TabsList>
                <TabsContent value="lightning">
                    { bolt12Offer &&
                        <div className='flex flex-col items-center gap-5'>
                        
                            { generateBolt11 &&
                                <>
                                    <Bolt11Form onGeneratedInvoice={setBolt11Invoice} onLoading={handleBolt11Loading}/>
                                    {bolt11Invoice && 
                                        <div className='flex flex-col items-center gap-5'>
                                            <p>{shorten(bolt11Invoice)}</p>
                                            <QRCode value={bolt11Invoice} size={150} />
                                            <div className='flex gap-5'>
                                                {navigator.canShare() &&
                                                    <div className='border p-3 rounded-full text-gray-500' onClick={() => shareLightningInvoice()}>
                                                        <LuShare2 className='w-5 h-5' />
                                                    </div>
                                                }
                                                <div className='border p-3 rounded-full text-gray-500 active:text-white active:bg-primary' onClick={() => copyLightningInvoice()}>
                                                    <LuCopy className='w-5 h-5' />
                                                </div>
                                            </div>
                                        </div>
                                    }
                                </>
                            }
                           
                            { !generateBolt11 && 
                                <div className='flex flex-col items-center gap-5'>
                                    <small className='text-gray-500'>{t('wallet.receive.lightningOffer')}:</small>
                                    <p>{shorten(bolt12Offer)}</p>
                                    <p className='text-xs'>Between {convertSatsToBtc(minLn)} - {convertSatsToBtc(maxLn)} BTC <br />({formatFiatAmount(convertSatsToBtc(minLn) * price)} - {formatFiatAmount(convertSatsToBtc(maxLn) * price)} {currency})</p>
                                    <QRCode value={bolt12Offer} size={150} />
                                    <div className='flex gap-5'>
                                        {navigator.canShare() &&
                                            <div className='border p-3 rounded-full text-gray-500' onClick={() => shareLightningInvoice()}>
                                                <LuShare2 className='w-5 h-5' />
                                            </div>
                                        }
                                        <div className='border p-3 rounded-full text-gray-500 active:text-white active:bg-primary' onClick={() => copyLightningInvoice()}>
                                            <LuCopy className='w-5 h-5' />
                                        </div>
                                    </div>
                                    <small className='text-gray-500 flex gap-2'>
                                        <Switch checked={generateBolt11} onCheckedChange={setGenerateBolt11}/>
                                        <span>Single use invoice</span>
                                    </small>
                                </div>
                            }
                            
                           
                        </div>
                    }
                </TabsContent>
                <TabsContent value="btc">
                    { btcAddress &&
                        <div className='p-5 flex flex-col items-center gap-5'>
                            <small className='text-gray-500'>{t('wallet.receive.btcAddress')}:</small>
                            <p>{shorten(btcAddress)}</p>
                            <p className='text-xs'>Between {convertSatsToBtc(minBtc)} - {convertSatsToBtc(maxBtc)} BTC <br />({ formatFiatAmount(convertSatsToBtc(minBtc) * price)} - {formatFiatAmount(convertSatsToBtc(maxBtc) * price)} {currency})</p>
                            <QRCode value={btcAddress} size={150} />
                            <div className='flex gap-5'>
                                <div className='flex gap-5'>
                                    {navigator.canShare() &&
                                        <div className='border p-3 rounded-full text-gray-500' onClick={() => shareBitcoinAddress()}>
                                            <LuShare2 className='w-5 h-5' />
                                        </div>
                                    }
                                    <div className='border p-3 rounded-full text-gray-500' onClick={() => copyBitcoinAddress()}>
                                        <LuCopy className='w-5 h-5' />
                                    </div>
                                </div>
                            </div>
                        </div>
                    }
                </TabsContent>
            </Tabs>
        </div>
    )
}