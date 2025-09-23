import { Page } from "@/components/Page";
import { Button } from "@/components/ui/button";
import { useWallet } from "@/lib/useWallet";
import { useTranslation } from "react-i18next";
import { BsCurrencyBitcoin } from "react-icons/bs";
import { AppList, type App } from "@/components/AppList";
import { Outlet, useNavigate } from "react-router-dom";
import { useEffect } from "react";

export function MainPage() {
    const wallet = useWallet(); 
    const { t } = useTranslation();
    const navigate = useNavigate();

    const apps = [
        { 
            name: "Wallet", 
            icon: BsCurrencyBitcoin, 
            className: "text-white bg-primary rounded-full p-2",
            path: "/wallet"
        },
    ];

    return (
        <Page back={false}>
            <div className="flex flex-col h-dvh pb-10">
                <AppList apps={apps} onChange={(app: App) => navigate(app.path)} />
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

                {wallet.walletExists && <Outlet />}
            </div>
        </Page>
    );
}