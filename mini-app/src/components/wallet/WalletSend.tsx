import { t } from 'i18next';
import React, { useEffect, useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

import { TelegramSendForm } from '@/components/wallet/TelegramSendForm';
import { BitcoinSendForm } from '@/components/wallet/BitcoinSendForm';
import { useWallet } from '@/lib/useWallet';
import { fetchBtcPrice } from '@/lib/coingecko';

export const WalletSend : React.FC = () => {

    const wallet = useWallet()
    const [price, setPrice] = useState(0)
    
    const [minBitcoin, setMinBitcoin] = useState(0)
    const [maxBitcoin, setMaxBitcoin] = useState(0)
    const [minLightning, setMinLightning] = useState(0)
    const [maxLightning, setMaxLigthning] = useState(0)

    useEffect(() => {
        if (wallet.breezSdk) {
            const loadPrices = async () => {
                const btcPrice = await fetchBtcPrice()
                if (btcPrice) {
                    setPrice(btcPrice)
                    const bitcoinLimits = await wallet?.breezSdk?.fetchOnchainLimits()
                    const lightningLimits = await wallet.breezSdk?.fetchLightningLimits()

                    if (bitcoinLimits) {
                        setMinBitcoin(bitcoinLimits.send.minSat / (10**8) * btcPrice)
                        setMaxBitcoin(bitcoinLimits.send.maxSat / (10**8) * btcPrice)
                    }
                     if (lightningLimits) {
                        setMinLightning(lightningLimits.send.minSat / (10**8) * btcPrice)
                        setMaxLigthning(lightningLimits.send.maxSat / (10**8) * btcPrice)
                    }
                }
            }

            loadPrices()
        }
    }, [wallet.breezSdk])

    const handleBtcSend = async (_address: string, _amount: number) => {
    }

    const handleLightningSend = () => {

    }

    return (
        <div className="flex flex-col gap-10">
            <Tabs defaultValue="telegram">
                <TabsList>
                    <TabsTrigger value="telegram">{t('wallet.sendTelegram')}</TabsTrigger>
                    <TabsTrigger value="btc">{t('wallet.payBitcoin')}</TabsTrigger>
                </TabsList>
                <TabsContent value="telegram">
                    <TelegramSendForm min={minLightning} max={maxLightning} price={price} onSend={handleLightningSend}/>
                </TabsContent>
                <TabsContent value="btc">
                    <BitcoinSendForm min={minBitcoin} max={maxBitcoin} price={price}  onSend={handleBtcSend}/>
                </TabsContent>
            </Tabs>
            
        </div>
    )
}