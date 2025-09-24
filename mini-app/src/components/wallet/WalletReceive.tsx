import { t } from 'i18next';
import React from 'react';

export const WalletReceive : React.FC = () => {
    return (
        <div className="flex flex-col gap-10 text-center">
            <p className="text-primary">{t('wallet.receiveTitle')}</p>
        </div>
    )
}