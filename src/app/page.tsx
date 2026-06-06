import Link from "next/link";
import { Activity, BadgeCheck, BookMarked, BrainCircuit, FolderKanban, GraduationCap, HardDrive, LayoutDashboard, ShieldCheck, Wrench } from "lucide-react";

const modules = [
  {
    name: "Dashboard Central",
    href: "/dashboard",
    icon: LayoutDashboard,
    description: "Métricas globales, foco semanal y evolución académica.",
  },
  {
    name: "Knowledge Hub",
    href: "/knowledge",
    icon: BookMarked,
    description: "Sistema de notas técnicas con enlaces internos y etiquetas.",
  },
  {
    name: "Learning Tracker",
    href: "/learning",
    icon: GraduationCap,
    description: "Seguimiento de cursos, módulos, lecciones y tiempo invertido.",
  },
  {
    name: "Lab Manager",
    href: "/labs",
    icon: Activity,
    description: "Registro de laboratorios en HTB, THM, PortSwigger y entorno local.",
  },
  {
    name: "Writeup Center",
    href: "/writeups",
    icon: BrainCircuit,
    description: "Documentación técnica en Markdown/MDX y snippets reutilizables.",
  },
  {
    name: "Certification Tracker",
    href: "/certifications",
    icon: BadgeCheck,
    description: "Plan de certificaciones con hitos, progreso y evidencias.",
  },
  {
    name: "Project Management",
    href: "/projects",
    icon: FolderKanban,
    description: "Gestión profesional de proyectos, prioridades y entregables.",
  },
  {
    name: "Cybersecurity Toolkit",
    href: "/toolkit",
    icon: Wrench,
    description: "Herramientas defensivas y educativas sin funcionalidades ofensivas.",
  },
  {
    name: "SIEM Academy",
    href: "/siem",
    icon: ShieldCheck,
    description: "Simulación académica de eventos, reglas, alertas y casos de uso.",
  },
  {
    name: "Home Lab Inventory",
    href: "/inventory",
    icon: HardDrive,
    description: "Inventario de equipos, VMs, redes, servicios y topologías.",
  },
];

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(56,189,248,0.18),transparent_35%),radial-gradient(circle_at_85%_10%,rgba(14,165,233,0.15),transparent_30%),radial-gradient(circle_at_50%_95%,rgba(59,130,246,0.2),transparent_35%)]" />
      <main className="relative mx-auto flex w-full max-w-7xl flex-col px-6 py-10 md:px-10 md:py-14">
        <header className="mb-8 rounded-2xl border border-sky-400/20 bg-slate-900/70 p-6 shadow-[0_0_80px_-30px_rgba(56,189,248,0.45)] backdrop-blur">
          <p className="mb-2 text-xs uppercase tracking-[0.24em] text-sky-300">Private SaaS Platform</p>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-100 md:text-5xl">
            Devices Security Lab V2
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-300 md:text-base">
            Centro profesional para formación en ciberseguridad, gestión de laboratorios, documentación técnica y evolución de carrera.
          </p>
          <div className="mt-6 flex flex-wrap gap-3 text-xs text-slate-200">
            <span className="rounded-full border border-sky-400/40 bg-sky-500/10 px-3 py-1">Next.js 16</span>
            <span className="rounded-full border border-cyan-400/40 bg-cyan-500/10 px-3 py-1">Prisma + PostgreSQL</span>
            <span className="rounded-full border border-emerald-400/40 bg-emerald-500/10 px-3 py-1">OWASP Defensive Controls</span>
          </div>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {modules.map((module) => {
            const Icon = module.icon;
            return (
              <Link
                key={module.name}
                href={module.href}
                className="group rounded-2xl border border-slate-700/70 bg-slate-900/60 p-5 transition duration-300 hover:-translate-y-0.5 hover:border-sky-400/50 hover:shadow-[0_14px_40px_-25px_rgba(56,189,248,0.65)]"
              >
                <div className="mb-4 inline-flex rounded-lg bg-slate-800 p-2 text-sky-300 ring-1 ring-slate-700 group-hover:text-cyan-200 group-hover:ring-sky-300/40">
                  <Icon size={18} />
                </div>
                <h2 className="mb-2 text-base font-semibold text-slate-100">{module.name}</h2>
                <p className="text-sm leading-relaxed text-slate-400">{module.description}</p>
              </Link>
            );
          })}
        </section>
      </main>
    </div>
  );
}
