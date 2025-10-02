import { t } from 'i18next';
import React, { useEffect, useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

import { TelegramSendForm } from '@/components/wallet/TelegramSendForm';
import { BitcoinSendForm } from '@/components/wallet/BitcoinSendForm';
import { useWallet } from '@/lib/useWallet';
import { PayAmount } from '@breeztech/breez-sdk-liquid/web';
import { convertBtcToSats } from '@/helpers/number';

export const WalletSend : React.FC = () => {

    const { getLimits, breezSdk, currency } = useWallet()
    const [price, setPrice] = useState(0)
    
    const [minBitcoin, setMinBitcoin] = useState(0)
    const [maxBitcoin, setMaxBitcoin] = useState(0)
    const [minLightning, setMinLightning] = useState(0)
    const [maxLightning, setMaxLigthning] = useState(0)
    const [sendLightningError, setSendLightningError] = useState<string|null>(null)

    useEffect(() => {
        const loadPrices = async () => {
            if (!breezSdk) {
                return
            }

            const fiatRates = await breezSdk.fetchFiatRates()
            if (fiatRates) {
                const rate = fiatRates.find(r => r.coin.toLowerCase() == currency.toLowerCase())
                if (rate) {
                    const { bitcoin: bitcoinLimits, lightning: lightningLimits} = await getLimits(breezSdk)
                    const btcPrice = rate.value
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
        }

        loadPrices()
    }, [breezSdk])

    const handleBtcSend = async (_address: string, _amount: number) => {
    }

    const handleLightningSend = async (bolt12Invoice: string, amount: number) => {
        setSendLightningError(null)
        const optionalAmount: PayAmount = {
            type: 'bitcoin',
            receiverAmountSat: convertBtcToSats(amount)
        }

        try {
            const prepareResponse = await breezSdk?.prepareSendPayment({
                destination: bolt12Invoice,
                amount: optionalAmount
            })

            console.log(prepareResponse)
        }
        catch(e: any) {
            setSendLightningError(e.message)
        }
    }

    return (
        <div className="flex flex-col gap-10">
            <Tabs defaultValue="telegram">
                <TabsList>
                    <TabsTrigger value="telegram">{t('wallet.sendTelegram')}</TabsTrigger>
                    <TabsTrigger value="btc">{t('wallet.payBitcoin')}</TabsTrigger>
                </TabsList>
                <TabsContent value="telegram">
                    <TelegramSendForm min={minLightning} max={maxLightning} price={price} onSend={handleLightningSend} sendError={sendLightningError} currency={currency}/>
                </TabsContent>
                <TabsContent value="btc">
                    <BitcoinSendForm min={minBitcoin} max={maxBitcoin} price={price}  onSend={handleBtcSend} currency={currency}/>
                </TabsContent>
            </Tabs>
            
        </div>
    )
}