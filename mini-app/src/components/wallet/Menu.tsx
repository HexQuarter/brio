import { t } from "i18next"
import { IconType } from "react-icons";
import { GoDownload, GoHistory, GoUpload } from "react-icons/go"
import { useLocation, useNavigate } from "react-router-dom"
import { useEffect, useState } from "react"

export const WalletMenu: React.FC = () => {
    const navigate = useNavigate()
    const location = useLocation()

    interface MenuItemType {
        name: string,
        icon: IconType,
        path: string,
        selected?: boolean
    }

    const [menuItems, setMenuItems] = useState<MenuItemType[]>([
        {
            name: t('wallet.menuReceiveBTC'),
            icon: GoDownload,
            path: '/wallet/receive',
        },
        {
            name: t('wallet.menuSendBTC'),
            icon: GoUpload,
            path: '/wallet/send',
        },
        {
            name: t('wallet.menuActivity'),
            icon: GoHistory,
            path: '/wallet/activity',
        }
    ])

    useEffect(() => {
        const updatedMenuItems = menuItems.map(item => ({
            ...item,
            selected: location.pathname === item.path
        }))

        setMenuItems(updatedMenuItems)
    }, [location])

    function handleMenuItemClicked(index: number) {
        let { path } = menuItems[index]
        setMenuItems(menuItems.map((item, i) => {
            item.selected = index == i
            return item
        }))
        navigate(path)
    }

    return (
        <div className="flex flex-row justify-center">
            {menuItems.map((item: any,  i: number) => (
                <div key={item.path} className={`flex flex-col gap-2 items-center ${item.selected ? 'text-white': 'text-slate-500'} w-30`} onClick={() => handleMenuItemClicked(i)}>
                    <div className={`w-12 h-12 ${!item.selected ? 'border-1 border-slate-500': ''}  rounded-full flex items-center justify-center ${item.selected ? 'bg-primary': ''}`}>
                        <item.icon className="w-5 h-5"/>
                    </div>
                    <p className="text-center text-slate-500">{item.name}</p>
                </div>
            ))}
        </div>
    )
}