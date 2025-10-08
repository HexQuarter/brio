import { Page } from "@/components/Page";
import { useWallet } from "@/lib/walletContext";
import { BsCurrencyBitcoin } from "react-icons/bs";
import { BiCollection } from "react-icons/bi";
import { AppList, type App } from "@/components/AppList";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { UnlockWalletPage } from "./wallet/UnlockWalletPage";
import { useEffect, useState } from "react";
import { BackupWalletPage } from "./wallet/BackupWalletPage";

export function MainPage() {
    const wallet = useWallet(); 
    const navigate = useNavigate();
    const location = useLocation()

    const [backup, setBackup] = useState(false)
    useEffect(() => {
        setBackup(location.pathname == '/wallet/backup')
    }, [location])

    const apps = [
        { 
            name: "Wallet", 
            icon: BsCurrencyBitcoin, 
            className: "text-white bg-primary rounded-full p-2",
            path: "/wallet"
        },
        { 
            name: "Coming apps", 
            icon: BiCollection, 
            className: "text-gray-500 bg-gray-200 rounded-full p-2",
            path: "/upcoming"
        },
    ];

    return (
        <Page back={backup || !wallet.walletExists}>
            <div className="flex flex-col h-dvh pb-10">
                {backup && <BackupWalletPage />}
                {!backup &&
                    <>
                        {!wallet.walletExists &&
                            <div>
                                <AppList apps={apps} onChange={(app: App) => navigate(`${app.path}?visit`)} />
                                <Outlet />
                            </div>
                        }

                        {wallet.walletExists && wallet.promptForPassword &&
                            <UnlockWalletPage />
                        }
                        {wallet.walletExists && !wallet.promptForPassword &&
                            <div>
                                <AppList apps={apps} onChange={(app: App) => navigate(app.path)} />
                                <Outlet />
                            </div>
                        }
                    </>
                }
            </div>
        </Page>
    );
}