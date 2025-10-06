import { Page } from "@/components/Page";
import { Button } from "@/components/ui/button";
import { useWallet } from "@/lib/useWallet";
import { useTranslation } from "react-i18next";
import { BsCurrencyBitcoin } from "react-icons/bs";
import { AppList, type App } from "@/components/AppList";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { UnlockWalletPage } from "./wallet/UnlockWalletPage";
import { useEffect, useState } from "react";
import { BackupWalletPage } from "./wallet/BackupWalletPage";
import { retrieveLaunchParams } from "@telegram-apps/sdk-react";

export function MainPage() {
    const wallet = useWallet(); 
    const { t } = useTranslation();
    const navigate = useNavigate();
    const location = useLocation()

    const [backup, setBackup] = useState(false)
    useEffect(() => {
        setBackup(location.pathname == '/wallet/backup')
    }, [location])

    useEffect(() => {
         const loadInvoiceRequest = async () => {
            const {tgWebAppData: data} = await retrieveLaunchParams()
            if (data?.start_param) {
                const startParam = new URLSearchParams(data.start_param)
                const invoiceRequest = startParam.get('invoiceRequest')
                const offer = startParam.get('offer')
                if (invoiceRequest && offer) {
                    try {
                        const invoice = await wallet.breezSdk?.createBolt12Invoice({
                            invoiceRequest: invoiceRequest,
                            offer: offer
                        })
                        console.log('Bolt12 Invoice', invoice)
                    }
                    catch(e) {
                        console.error(e)
                    }
                }
            }
        }

        loadInvoiceRequest()
    }, [])

    const apps = [
        { 
            name: "Wallet", 
            icon: BsCurrencyBitcoin, 
            className: "text-white bg-primary rounded-full p-2",
            path: "/wallet"
        },
    ];

    return (
        <Page back={backup || !wallet.walletExists}>
            <div className="flex flex-col h-dvh pb-10">
                {backup && <BackupWalletPage />}
                {!backup &&
                    <>
                        <AppList apps={apps} onChange={(app: App) => navigate(app.path)} />
                        {backup && <Outlet />}
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
                                                <Button className="w-40" onClick={() => navigate('/onboarding/create-wallet')}>{t('main.createButton')}</Button>
                                                <Button variant="secondary" className="w-40" onClick={() => navigate('/onboarding/restore-wallet')}>{t('main.restoreButton')}</Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        }

                        {wallet.walletExists && wallet.promptForPassword &&
                            <UnlockWalletPage />
                        }
                        {wallet.walletExists && !wallet.promptForPassword &&
                            <Outlet />
                        }
                    </>
                }
                
                
            </div>
        </Page>
    );
}