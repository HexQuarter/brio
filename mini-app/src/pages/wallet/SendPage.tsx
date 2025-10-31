import { t } from 'i18next';
import React from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

import { TelegramSendForm } from '@/components/wallet/TelegramSendForm';
import { BitcoinSendForm } from '@/components/wallet/BitcoinSendForm';

export const WalletSendPage : React.FC = () => {
    return (
            <div className="flex flex-col gap-10">
                <Tabs defaultValue="telegram">
                    <TabsList className='flex rounded-sm gap-2 bg-none'>
                        <TabsTrigger className='rounded-sm' value="telegram">{t('wallet.sendTelegram')}</TabsTrigger>
                        <TabsTrigger className='rounded-sm' value="pay">{t('wallet.payBitcoin')}</TabsTrigger>
                    </TabsList>
                    <TabsContent value="telegram">
                        <TelegramSendForm />
                    </TabsContent>
                    <TabsContent value="pay">
                        <BitcoinSendForm />
                    </TabsContent>
                </Tabs>
            </div>
    )
}