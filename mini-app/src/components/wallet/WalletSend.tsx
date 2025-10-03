import { t } from 'i18next';
import React from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

import { TelegramSendForm } from '@/components/wallet/TelegramSendForm';
import { BitcoinSendForm } from '@/components/wallet/BitcoinSendForm';

export const WalletSend : React.FC = () => {
    return (
        <div className="flex flex-col gap-10">
            <Tabs defaultValue="telegram">
                <TabsList>
                    <TabsTrigger value="telegram">{t('wallet.sendTelegram')}</TabsTrigger>
                    <TabsTrigger value="btc">{t('wallet.payBitcoin')}</TabsTrigger>
                </TabsList>
                <TabsContent value="telegram">
                    <TelegramSendForm />
                </TabsContent>
                <TabsContent value="btc">
                    <BitcoinSendForm />
                </TabsContent>
            </Tabs>
            
        </div>
    )
}