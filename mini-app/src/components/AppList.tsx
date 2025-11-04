import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { IconType } from "react-icons";
import { useLocation, useNavigate } from "react-router-dom";
import { BiCollection } from "react-icons/bi";

export type App  = {
    name: string;
    icon: IconType;
    className: string;
    path: string
}

interface AppListProps {
    apps: App[],
    onChange: (app: App) => void
}

export const AppList: React.FC<AppListProps> = ({ apps, onChange }) => {
    const { t } = useTranslation()
    const [active, setActive] = useState(0)

    const location = useLocation()
    const navigate = useNavigate()

    useEffect(() => {
        const index = apps.findIndex(a => location.pathname.includes(a.path))
        setActive(index)
    }, [location])

    const changeApp = (app: App, index :number) => {
        setActive(index)
        onChange(app)
    }

    return (
        <div className="flex gap-5 justify-center">
            {apps.map((app: App, index) => (
                <div key={app.name} className={`flex flex-col items-center gap-2 p-2 ${index == active ? 'border-b-1' : ''}`} onClick={() => changeApp(app, index)}>
                    <app.icon className={`w-10 h-10 ${app.className}`}/>
                    <span className={`text-sm text-center`}>{t(app.name)}</span>
                </div>
            ))}
            <div className='flex flex-col items-center gap-2 p-2' onClick={() => navigate('/app/upcoming')}>
                <BiCollection className='w-10 h-10 text-gray-500 bg-gray-200 rounded-full p-2'/>
                <span className={`text-sm text-center`}>{t('next_apps')}</span>
            </div>
        </div>
    )
}