import { t } from 'i18next';
import React, { useState } from 'react';
import { Tabs, TabsList, TabsContent, TabsTrigger } from '@/components/ui/tabs';

import { LuShare2, LuCopy } from "react-icons/lu";
import QRCode from "react-qr-code";

const shorten = (data: string) => {
    return `${data.slice(0, 6)}...${data.slice(data.length-6, data.length)}`
}

export const WalletReceive : React.FC = () => {

    const [lightningInvoice, setLightningInvoice] = useState("")
    const [btcAddress, setBtcAddress] = useState("bc1qh9k6fs50clkzpe0un2vn735mkh24v5wx9kyml2")

    return (
        <div className="flex flex-col gap-10 text-center">
            <p className="text-primary">{t('wallet.receiveTitle')}</p>
            <Tabs defaultValue="lightning">
                <TabsList>
                    <TabsTrigger value="lightning">{t('wallet.receive.lightningTitle')}</TabsTrigger>
                    <TabsTrigger value="btc">{t('wallet.receive.btcTitle')}</TabsTrigger>
                </TabsList>
                <TabsContent value="lightning">
                    <div className='p-5 flex flex-col items-center gap-5'>
                        <small className='text-gray-500'>{t('wallet.receive.lightningInvoice')}:</small>
                        <p>{shorten(lightningInvoice)}</p>
                        <QRCode value={lightningInvoice} size={150} />
                        <div className='flex gap-5'>
                            <div className='border p-3 rounded-full text-gray-500'>
                                <LuShare2 className='w-5 h-5'/>
                            </div>
                            <div className='border p-3 rounded-full text-gray-500'>
                                <LuCopy className='w-5 h-5'/>
                            </div>
                        </div>
                    </div>
                </TabsContent>
                <TabsContent value="btc">
                    <div className='p-5 flex flex-col items-center gap-5'>
                        <small className='text-gray-500'>{t('wallet.receive.btcAddress')}:</small>
                        <p>{shorten(btcAddress)}</p>
                        <QRCode value={btcAddress} size={150} />
                        <div className='flex gap-5'>
                            <div className='border p-3 rounded-full text-gray-500'>
                                <LuShare2 className='w-5 h-5'/>
                            </div>
                            <div className='border p-3 rounded-full text-gray-500'>
                                <LuCopy className='w-5 h-5'/>
                            </div>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    )
}