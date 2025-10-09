import { t } from 'i18next';
import React, { useEffect, useState } from 'react';
import { Tabs, TabsList, TabsContent, TabsTrigger } from '@/components/ui/tabs';

import { LuShare2, LuCopy } from "react-icons/lu";
import QRCode from "react-qr-code";
import { useWallet } from '@/lib/walletContext';
import { toast } from "sonner"
import { Page } from "@/components/Page";
import { openTelegramLink } from '@telegram-apps/sdk-react';


const shorten = (data: string) => {
    return `${data.slice(0, 6)}...${data.slice(data.length-6, data.length)}`
}

export const WalletReceivePage : React.FC = () => {
    const { getBtcAddress, getLnUrl, breezSdk  } = useWallet()

    const [btcAddress, setBtcAddress] = useState<string | undefined>(undefined)
    const [lnURL, setLnURL] = useState<string | undefined>(undefined)
    useEffect(() => {
        if (!breezSdk) {
            return
        }

        const loadOfferAndAddress = async () => {
            const invoice = await getLnUrl(breezSdk)
            if (invoice) {
                setLnURL(invoice)
            }

            const btcAddress = await getBtcAddress(breezSdk)
            if (btcAddress) {
                setBtcAddress(btcAddress)
            }
        }
        loadOfferAndAddress()
    }, [breezSdk])

    const copyLightningAddress = async () => {
        lnURL && await navigator.clipboard.writeText(lnURL)
        const toastId = toast.info(t('wallet.receive.copyLnToast'))
        setTimeout(() => toast.dismiss(toastId), 2000)
    }

    const shareLightningAddress = async () => {
        const msg = `Here my Brio's Lightning address ${lnURL}`
        openTelegramLink(
            `https://t.me/share/url?url=${encodeURIComponent('https://t.me/brio_dev_bot')}&text=${encodeURIComponent(msg)}`
        )
    }

    const copyBitcoinAddress = async () => {
        btcAddress && await navigator.clipboard.writeText(btcAddress)
        const toastId = toast.info(t('wallet.receive.copybtcToast'))
        setTimeout(() => toast.dismiss(toastId), 2000)
    }

    const shareBitcoinAddress = async () => {
        const msg = `Here my Brio's Bitcoin address ${btcAddress}`
        btcAddress && openTelegramLink(
            `https://t.me/share/url?url=${encodeURIComponent('https://t.me/brio_dev_bot')}&text=${encodeURIComponent(msg)}`
        )
    }

    return (
        <Page back={true}>
            <div className="flex flex-col gap-10 text-center">
                <p className="text-primary">{t('wallet.receiveTitle')}</p>
                <Tabs defaultValue="lightning">
                    <TabsList>
                        <TabsTrigger value="lightning">{t('wallet.receive.lightningTitle')}</TabsTrigger>
                        <TabsTrigger value="btc">{t('wallet.receive.btcTitle')}</TabsTrigger>
                    </TabsList>
                    <TabsContent value="lightning">
                        { lnURL &&
                            <div className='flex flex-col items-center gap-5'>
                                <div className='flex flex-col items-center gap-5'>
                                    <small className='text-gray-500'>{t('wallet.receive.lightningOffer')}:</small>
                                    <p>{shorten(lnURL)}</p>
                                    <QRCode value={lnURL} size={150} />
                                    <div className='flex gap-5'>
                                        {openTelegramLink.isAvailable() &&
                                            <div className='border p-3 rounded-full text-gray-500' onClick={() => shareLightningAddress()}>
                                                <LuShare2 className='w-5 h-5' />
                                            </div>
                                        }
                                        <div className='border p-3 rounded-full text-gray-500 active:text-white active:bg-primary' onClick={() => copyLightningAddress()}>
                                            <LuCopy className='w-5 h-5' />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        }
                    </TabsContent>
                    <TabsContent value="btc">
                        { btcAddress &&
                            <div className='p-5 flex flex-col items-center gap-5'>
                                <small className='text-gray-500'>{t('wallet.receive.btcAddress')}:</small>
                                <p>{shorten(btcAddress)}</p>
                                <QRCode value={btcAddress} size={150} />
                                <div className='flex gap-5'>
                                    <div className='flex gap-5'>
                                        {openTelegramLink.isAvailable() &&
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
        </Page>
    )
}