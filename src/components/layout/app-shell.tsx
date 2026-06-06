"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, BadgeCheck, BookMarked, BrainCircuit, FolderKanban, GraduationCap, HardDrive, LayoutDashboard, ShieldCheck, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/knowledge", label: "Knowledge Hub", icon: BookMarked },
  { href: "/learning", label: "Learning Tracker", icon: GraduationCap },
  { href: "/labs", label: "Lab Manager", icon: Activity },
  { href: "/writeups", label: "Writeup Center", icon: BrainCircuit },
  { href: "/certifications", label: "Certification Tracker", icon: BadgeCheck },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/toolkit", label: "Toolkit", icon: Wrench },
  { href: "/siem", label: "SIEM Academy", icon: ShieldCheck },
  { href: "/inventory", label: "Lab Inventory", icon: HardDrive },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col lg:flex-row">
      <aside className="w-full border-b border-slate-800 bg-slate-950/80 p-4 lg:w-72 lg:border-b-0 lg:border-r">
        <div className="mb-6">
          <p className="text-xs uppercase tracking-[0.18em] text-sky-300">Devices Security Lab V2</p>
          <h2 className="mt-1 text-lg font-semibold text-slate-100">Cybersecurity Workspace</h2>
        </div>
        <nav className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition",
                  active
                    ? "border-sky-400/50 bg-sky-500/10 text-sky-100"
                    : "border-slate-800 bg-slate-900/70 text-slate-300 hover:border-slate-700 hover:text-slate-100"
                )}
              >
                <Icon size={16} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>
      <section className="flex-1 p-4 md:p-8">{children}</section>
    </div>
  );
}
