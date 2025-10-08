import { ComingSoon } from "@/components/ComingSoon";
import { Page } from "@/components/Page";

export function ComingSoonPage() {
    return (
        <Page back={true}>
            <div className="flex flex-col h-dvh pb-10">
                <ComingSoon carousel={false} />
            </div>
        </Page>
    );
}