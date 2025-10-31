import { apps } from "@/lib/apps"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"

export const AppsGrid = () => {
    const {t} = useTranslation()
    const navigate = useNavigate()

    return (
        <div className="grid grid-cols-2 gap-5 bg-gray-100 rounded-sm p-5 w-full">
            {apps.map((app) => (
                <div key={app.name} className="bg-white p-5 flex flex-col items-center justify-center text-center gap-5 rounded-sm" onClick={() => navigate(app.path)}>
                    <app.icon className={`w-10 h-10 ${app.className}`}/>
                    <p>{t(app.name)}</p>
                </div>
            ))}
        </div>  
    )
}