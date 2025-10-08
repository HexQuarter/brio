import { useState } from "react";
import { IconType } from "react-icons";

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

    const [active, setActive] = useState(0)

    const changeApp = (app: App, index :number) => {
        setActive(index)
        onChange(app)
    }

    return (
        <div className="flex gap-5 justify-center">
            {apps.map((app: App, index) => (
                <div key={app.name} className={`flex flex-col items-center gap-2 p-5 mb-5`} onClick={() => changeApp(app, index)}>
                    <app.icon className={`w-10 h-10 ${app.className}`}/>
                    <span className={`text-sm ${index == active ? 'border-b-1' : ''}`}>{app.name}</span>
                </div>
            ))}
        </div>
    )
}