import Link from "next/link";
import { Lock, BriefcaseBusiness, ShieldCheck, Rocket } from "lucide-react";

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(56,189,248,0.18),transparent_35%),radial-gradient(circle_at_85%_10%,rgba(14,165,233,0.15),transparent_30%),radial-gradient(circle_at_50%_95%,rgba(59,130,246,0.2),transparent_35%)]" />
      <main className="relative mx-auto flex w-full max-w-7xl flex-col px-6 py-10 md:px-10 md:py-14">
        <header className="mb-8 rounded-2xl border border-sky-400/20 bg-slate-900/70 p-6 shadow-[0_0_80px_-30px_rgba(56,189,248,0.45)] backdrop-blur">
          <p className="mb-2 text-xs uppercase tracking-[0.24em] text-sky-300">Production Release Candidate</p>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-100 md:text-5xl">
            Devices Security Lab V2
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-300 md:text-base">
            Plataforma dual: espacio privado para operación académica y laboratorio, más área pública de portafolio profesional para demostrar proyectos y trayectoria.
          </p>
          <div className="mt-6 flex flex-wrap gap-3 text-xs text-slate-200">
            <span className="rounded-full border border-sky-400/40 bg-sky-500/10 px-3 py-1">Next.js 16</span>
            <span className="rounded-full border border-cyan-400/40 bg-cyan-500/10 px-3 py-1">Prisma + PostgreSQL</span>
            <span className="rounded-full border border-emerald-400/40 bg-emerald-500/10 px-3 py-1">OWASP Defensive Controls</span>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/portfolio"
              className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-500"
            >
              <BriefcaseBusiness className="h-4 w-4" />
              Ver Portafolio
            </Link>
            <Link
              href="/signin"
              className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-medium text-slate-200 hover:border-slate-600"
            >
              <Lock className="h-4 w-4" />
              Acceso Privado
            </Link>
          </div>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              title: "Modo Privado",
              description: "Gestión de aprendizaje, home lab, SIEM académico y toolkit defensivo con acceso autenticado.",
              icon: Lock,
            },
            {
              title: "Modo Portafolio",
              description: "Exhibición pública de proyectos, certificaciones y writeups publicados para perfil profesional.",
              icon: BriefcaseBusiness,
            },
            {
              title: "Listo para Release",
              description: "SEO, hardening de middleware, CI/CD, Docker y documentación completa para demos y entrevistas.",
              icon: Rocket,
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <article key={item.title} className="rounded-2xl border border-slate-700/70 bg-slate-900/60 p-5">
                <div className="mb-4 inline-flex rounded-lg bg-slate-800 p-2 text-sky-300 ring-1 ring-slate-700">
                  <Icon size={18} />
                </div>
                <h2 className="mb-2 text-base font-semibold text-slate-100">{item.title}</h2>
                <p className="text-sm leading-relaxed text-slate-400">{item.description}</p>
              </article>
            );
          })}
        </section>

        <section className="mt-8 rounded-2xl border border-emerald-500/25 bg-emerald-500/10 p-4 text-sm text-emerald-100">
          <p className="inline-flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" />
            Esta plataforma se mantiene con enfoque exclusivamente defensivo y educativo.
          </p>
        </section>
      </main>
    </div>
  );
}
