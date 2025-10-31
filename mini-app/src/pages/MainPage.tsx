import { AppList, type App } from "@/components/AppList";
import { Outlet, useNavigate } from "react-router-dom";
import { Page } from "@/components/Page";
import { apps } from "@/lib/apps";

export function MainPage() {
    const navigate = useNavigate();

    return (
        <div className="flex flex-col h-dvh pb-10">
            <AppList apps={apps} onChange={(app: App) => navigate(`${app.path}`)} />
            <Page back={true}>
                <Outlet />
            </Page>
        </div>
    );
}