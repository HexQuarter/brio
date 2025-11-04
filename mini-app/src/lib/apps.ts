import { IconType } from "react-icons";
import { BsCurrencyBitcoin } from "react-icons/bs";
import { FaVoteYea } from "react-icons/fa";

export type App = {
    name: string
    icon: IconType
    className: string
    path: string
    hideFromGrid?: boolean
}

export const apps = [
    { 
        name: 'wallet', 
        icon: BsCurrencyBitcoin, 
        className: "text-white bg-primary rounded-full p-2",
        path: "/app/wallet"
    },
    { 
        name: 'wallet', 
        icon: BsCurrencyBitcoin, 
        className: "text-white bg-primary rounded-full p-2",
        path: "/app/nowallet",
        hideFromGrid: true
    },
    { 
        name: 'yourVoice', 
        icon: FaVoteYea, 
        className: "text-white bg-gray-600 rounded-full p-2",
        path: "/app/yourvoice"
    }
];