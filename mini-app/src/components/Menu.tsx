import { IconType } from "react-icons";
import { useLocation } from "react-router-dom"
import { useEffect, useState } from "react"

interface MenuItemType {
    name: string,
    icon: IconType,
    path: string,
    selected?: boolean
}

interface Props {
    items: MenuItemType[],
    buttonSize?: number
}

export const Menu: React.FC<Props> = ({ items, buttonSize = 30 }) => {
    const location = useLocation()

    const [menuItems, setMenuItems] = useState<MenuItemType[]>(items)

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
        window.location.replace(`#${path}`)
    }

    return (
        <div className="flex flex-row justify-center gap-2">
            {menuItems.map((item: any, i: number) => (
                <div key={item.path} className={`flex flex-col gap-2 items-center ${item.selected ? 'text-white' : 'text-slate-500'} w-${buttonSize}`} onClick={() => handleMenuItemClicked(i)}>
                    <div className={`w-12 h-12 ${!item.selected ? 'border-1 border-slate-500' : ''}  rounded-full flex items-center justify-center ${item.selected ? 'bg-primary' : ''}`}>
                        <item.icon className="w-5 h-5" />
                    </div>
                    <p className="text-center text-slate-500">{item.name}</p>
                </div>
            ))}
        </div>
    )
}