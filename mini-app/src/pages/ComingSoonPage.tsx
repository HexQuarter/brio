import { ComingSoon } from "@/components/ComingSoon";

export function ComingSoonPage() {
    return (
        <div className="flex flex-col h-dvh pb-10">
            <ComingSoon carousel={false} />
        </div>
    );
}