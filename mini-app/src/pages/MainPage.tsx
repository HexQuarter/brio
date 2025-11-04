import { type App } from "@/components/AppList";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Page } from "@/components/Page";
import { apps } from "@/lib/apps";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { GrAppsRounded } from "react-icons/gr";

export function MainPage() {
    const location = useLocation()
    const navigate = useNavigate();
    const { t } = useTranslation()

    const [currentApp, setCurrentApp] = useState<App | null>(null)

    useEffect(() => {
        const app = apps.find(a => location.pathname.includes(a.path))
        if (app) {
            setCurrentApp(app)
        }
    }, [location])

    return (
        <div className="flex flex-col h-dvh pb-10">
            <div className="flex gap-5 justify-center">
                <div className={`flex flex-col items-center gap-2 p-2`} onClick={() => window.location.replace(`#/apps`)}>
                    <GrAppsRounded className={`w-10 h-10 text-gray-800 rounded-full p-2`} />
                    <span className={`text-sm text-center`}>{t('home')}</span>
                </div>
                {currentApp &&
                    <div className={`flex flex-col items-center gap-2 p-2`} onClick={() => navigate(`${currentApp.path}`)}>
                        <currentApp.icon className={`w-10 h-10 ${currentApp.className}`} />
                        <span className={`text-sm text-center`}>{t(currentApp.name)}</span>
                    </div>
                }
            </div>

            <Page back={true}>
                <div className="mt-10">
                    <Outlet />
                </div>
            </Page>
        </div>
    );
}