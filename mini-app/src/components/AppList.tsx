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
    return (
        <div className="flex flex-col gap-5">
            {apps.map((app: App) => (
                <div key={app.name} className={`flex flex-col items-center gap-2 p-5 mb-5`} onClick={() => onChange(app)}>
                    <app.icon className={`w-10 h-10 ${app.className}`}/>
                    <span className="text-sm">{app.name}</span>
                </div>
            ))}
        </div>
    )
}