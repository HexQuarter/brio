import { useWallet } from "@/lib/walletContext";
import { BsCurrencyBitcoin } from "react-icons/bs";
import { BiCollection } from "react-icons/bi";
import { AppList, type App } from "@/components/AppList";
import { Outlet, useNavigate } from "react-router-dom";

export function MainPage() {
    const wallet = useWallet(); 
    const navigate = useNavigate();

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
        <div className="flex flex-col h-dvh pb-10">
            <AppList apps={apps} onChange={(app: App) => wallet.walletExists ? navigate(`${app.path}`) : navigate(`${app.path}?visit`) } />
            <Outlet />
        </div>
    );
}