import { AppShell } from "@/components/layout/app-shell";

export default function PlatformLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <AppShell>{children}</AppShell>
    </div>
  );
}
