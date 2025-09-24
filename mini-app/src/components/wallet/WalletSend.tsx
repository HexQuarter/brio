import { t } from 'i18next';
import React, { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';

import { TelegramSendForm } from '@/components/wallet/TelegramSendForm';
import { BitcoinSendForm } from '@/components/wallet/BitcoinSendForm';

export const WalletSend : React.FC = () => {

    const handleAddressChange = (address: string) => {}
    const [btcAmount, setBtcAmount] = useState(0)

    return (
        <div className="flex flex-col gap-10">
            <Tabs defaultValue="telegram">
                <TabsList>
                    <TabsTrigger value="telegram">{t('wallet.sendTelegram')}</TabsTrigger>
                    <TabsTrigger value="btc">{t('wallet.payBitcoin')}</TabsTrigger>
                </TabsList>
                <TabsContent value="telegram">
                    <TelegramSendForm onAdddressChange={handleAddressChange} onBtcAmountChange={setBtcAmount}/>
                </TabsContent>
                <TabsContent value="btc">
                    <BitcoinSendForm onAdddressChange={handleAddressChange} onBtcAmountChange={setBtcAmount}/>
                </TabsContent>
            </Tabs>
            <div className="flex justify-center">
                <Button>Send</Button>
            </div>
        </div>
    )
}