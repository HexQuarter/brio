import { t } from 'i18next';
import React from 'react';

export const WelcomeWallet : React.FC = () => {
    return (
        <div className="flex flex-col gap-10 text-center">
            <h3 className="text-2xl font-medium">{t('main.welcomeTitle')}</h3>
            <p>{t('main.welcomeDescription')}</p>
        </div>
    )
}