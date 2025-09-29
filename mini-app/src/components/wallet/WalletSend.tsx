import { t } from 'i18next';
import React, { useEffect, useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

import { TelegramSendForm } from '@/components/wallet/TelegramSendForm';
import { BitcoinSendForm } from '@/components/wallet/BitcoinSendForm';
import { useWallet } from '@/lib/useWallet';
import { fetchBtcPrice } from '@/lib/coingecko';

export const WalletSend : React.FC = () => {

    const { bitcoinLimits, lightningLimits } = useWallet()
    const [price, setPrice] = useState(0)
    
    const [minBitcoin, setMinBitcoin] = useState(bitcoinLimits.min)
    const [maxBitcoin, setMaxBitcoin] = useState(bitcoinLimits.max)
    const [minLightning, setMinLightning] = useState(lightningLimits.min)
    const [maxLightning, setMaxLigthning] = useState(lightningLimits.max)

    useEffect(() => {
        const loadPrices = async () => {
            const btcPrice = await fetchBtcPrice()

            if (btcPrice) {
                setPrice(btcPrice)
                if (bitcoinLimits) {
                    setMinBitcoin(bitcoinLimits.min * btcPrice)
                    setMaxBitcoin(bitcoinLimits.max * btcPrice)
                }
                    if (lightningLimits) {
                    setMinLightning(lightningLimits.min * btcPrice)
                    setMaxLigthning(lightningLimits.max * btcPrice)
                }
            }
        }

        loadPrices()
    }, [])

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