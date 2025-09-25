import { t } from 'i18next';
import React, { useEffect, useState } from 'react';
import { Tabs, TabsList, TabsContent, TabsTrigger } from '@/components/ui/tabs';

import { LuShare2, LuCopy } from "react-icons/lu";
import QRCode from "react-qr-code";
import { useWallet } from '@/lib/useWallet';

const shorten = (data: string) => {
    return `${data.slice(0, 6)}...${data.slice(data.length-6, data.length)}`
}

export const WalletReceive : React.FC = () => {

    const wallet = useWallet()

    const [lightningInvoice, setLightningInvoice] = useState("")
    const [btcAddress, setBtcAddress] = useState("")

    useEffect(() => {
        const loadInvoice = async () => {
            const prepareResponse = await wallet.breezSdk?.prepareReceivePayment({
                paymentMethod: 'bolt12Offer'
            })

            if (prepareResponse) {
                const res = await wallet.breezSdk?.receivePayment({
                    prepareResponse
                })
                if (res) {
                    setLightningInvoice(res.destination)
                }
            }
        }

        const loadBtcAddress = async () => {
            const prepareResponse = await wallet.breezSdk?.prepareReceivePayment({
                paymentMethod: 'bitcoinAddress'
            })

            if (prepareResponse) {
                const res = await wallet.breezSdk?.receivePayment({
                    prepareResponse
                })
                if (res) {
                    const split = res.destination.split(':')[1].split("?")[0]
                    console.log(res.destination)
                    setBtcAddress(split)
                }
            }
        }

        loadInvoice()
        loadBtcAddress()
    }, [wallet.breezSdk])

    const copyLightningInvoice = async () => {
        // TODO: show toast when invoice is copied
        await navigator.clipboard.writeText(lightningInvoice)
    }

    const shareLightningInvoice = async () => {
        await navigator.share({ text: lightningInvoice })
    }

    const copyBitcoinAddress = async () => {
        // TODO: show toast when invoice is copied
        await navigator.clipboard.writeText(btcAddress)
    }

    const shareBitcoinAddress = async () => {
        await navigator.share({ text: btcAddress })
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
                    { lightningInvoice != "" &&
                        <div className='p-5 flex flex-col items-center gap-5'>
                            <small className='text-gray-500'>{t('wallet.receive.lightningInvoice')}:</small>
                            <p>{shorten(lightningInvoice)}</p>
                            <QRCode value={lightningInvoice} size={150} />
                            <div className='flex gap-5'>
                                {navigator.canShare() &&
                                    <div className='border p-3 rounded-full text-gray-500' onClick={() => shareLightningInvoice()}>
                                        <LuShare2 className='w-5 h-5' />
                                    </div>
                                }
                                <div className='border p-3 rounded-full text-gray-500' onClick={() => copyLightningInvoice()}>
                                    <LuCopy className='w-5 h-5' />
                                </div>
                            </div>
                        </div>
                    }
                </TabsContent>
                <TabsContent value="btc">
                    <div className='p-5 flex flex-col items-center gap-5'>
                        <small className='text-gray-500'>{t('wallet.receive.btcAddress')}:</small>
                        <p>{shorten(btcAddress)}</p>
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
                </TabsContent>
            </Tabs>
        </div>
    )
}