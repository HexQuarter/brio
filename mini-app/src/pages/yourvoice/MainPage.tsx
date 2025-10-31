import { Outlet } from "react-router-dom";

export function YourVoiceMainPage() {
  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-4xl mx-auto p-2">
        <Outlet />
      </main>
    </div>
  );
}
