import { Page } from "@/components/Page";
import { Button } from "@/components/ui/button";
import { useWallet } from "@/lib/useWallet";
import { useTranslation } from "react-i18next";
import { BsCurrencyBitcoin } from "react-icons/bs";
import { WalletMainPage } from "./WalletMainPage";
import { useState } from "react";

export function MainPage() {
    const wallet = useWallet(); 
    const { t } = useTranslation();

    const apps = [
        { 
            name: "Wallet", 
            icon: BsCurrencyBitcoin, 
            className: "text-white bg-primary rounded-full p-2",
            component: <WalletMainPage />
        },
    ];

    const [selectedApp, setSelectedApp] = useState(apps[0]);
    
    return (
        <Page back={false}>
            <div className="flex flex-col h-dvh pb-10">
                <div className="flex flex-col gap-5">
                    {apps.map((app) => (
                        <div key={app.name} className={`flex flex-col items-center gap-2 p-5 mb-5`} onClick={() => setSelectedApp(app)}>
                            <app.icon className={`w-10 h-10 ${app.className}`}/>
                            <span className="text-sm">{app.name}</span>
                        </div>
                    ))}
                </div>
                
                {!wallet.walletExists &&
                    <div className="bg-gray-100 p-5 rounded-xl flex-1 flex flex-col">
                        <div className="p-5 bg-white rounded-xl flex-1">
                            <div className='flex flex-col gap-5'>
                                <div className="flex flex-col gap-10">
                                    <div className="flex flex-col gap-10">
                                        <h3 className='text-2xl font-medium'>{t('main.nowalletTitle')}</h3>
                                        <p>{t('main.nowalletDescription_1')}</p>
                                        <p>{t('main.nowalletDescription_2')}</p>
                                        <p>{t('main.nowalletDescription_3')}</p>
                                    </div>
                                    <div className="flex flex-col gap-5 items-center">
                                        <Button className="w-40">{t('main.createButton')}</Button>
                                        <Button variant="secondary" className="w-40">{t('main.restoreButton')}</Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                }

                {wallet.walletExists && selectedApp.component}
            </div>
        </Page>
    );
}