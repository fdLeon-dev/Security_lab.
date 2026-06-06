import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink, FileText, GraduationCap, Layers, Sparkles } from "lucide-react";
import { getPublicPortfolioData } from "@/server/modules/portfolio/portfolio.service";
import type { PortfolioData } from "@/server/modules/portfolio/portfolio.service";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Portfolio Profesional | Devices Security Lab V2",
  description:
    "Portafolio público con proyectos, certificaciones, writeups públicos, stack tecnológico y timeline profesional en ciberseguridad defensiva.",
  openGraph: {
    title: "Portfolio Profesional | Devices Security Lab V2",
    description:
      "Explora proyectos, certificaciones y writeups públicos con enfoque académico-defensivo.",
    url: "/portfolio",
    type: "website",
    images: [{ url: "/og-image.svg", width: 1200, height: 630, alt: "Devices Security Lab V2 Portfolio" }],
  },
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("es-ES", { year: "numeric", month: "short" });
}

export default async function PortfolioPage() {
  let data: PortfolioData = {
    profile: {
      name: "Devices Security Lab",
      role: "Cybersecurity Analyst / Student",
      summary:
        "Plataforma privada de práctica y laboratorio, con portafolio público orientado a ciberseguridad defensiva, documentación técnica y mejora continua.",
      timelineLabel: "N/A",
    },
    projects: [],
    certifications: [],
    writeups: [],
    technologies: [],
    timeline: [],
  };

  try {
    data = await getPublicPortfolioData();
  } catch {
    // Fallback allows build and preview environments without DB connectivity
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_10%,rgba(14,165,233,0.18),transparent_30%),radial-gradient(circle_at_90%_20%,rgba(56,189,248,0.16),transparent_35%),radial-gradient(circle_at_50%_100%,rgba(2,132,199,0.2),transparent_35%)]" />

      <div className="relative mx-auto max-w-7xl px-6 py-12 md:px-10">
        <header className="rounded-3xl border border-sky-500/25 bg-slate-900/70 p-7 shadow-[0_0_80px_-35px_rgba(56,189,248,0.55)] backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-sky-300">Portfolio Público</p>
              <h1 className="mt-1 text-3xl font-semibold tracking-tight md:text-5xl">{data.profile.name}</h1>
              <p className="mt-2 text-sm text-slate-300 md:text-base">{data.profile.role}</p>
            </div>
            <div className="flex gap-3">
              <Link
                href="/signin"
                className="rounded-lg border border-sky-400/40 bg-sky-500/10 px-4 py-2 text-sm text-sky-200 hover:bg-sky-500/20"
              >
                Acceso Privado
              </Link>
            </div>
          </div>
          <p className="mt-5 max-w-3xl text-sm leading-relaxed text-slate-300 md:text-base">{data.profile.summary}</p>
        </header>

        <section className="mt-8 grid gap-4 md:grid-cols-3">
          <article className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
            <h2 className="flex items-center gap-2 text-sm font-medium text-slate-300">
              <Layers className="h-4 w-4 text-sky-400" />
              Proyectos
            </h2>
            <p className="mt-2 text-3xl font-semibold text-slate-100">{data.projects.length}</p>
          </article>
          <article className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
            <h2 className="flex items-center gap-2 text-sm font-medium text-slate-300">
              <GraduationCap className="h-4 w-4 text-sky-400" />
              Certificaciones
            </h2>
            <p className="mt-2 text-3xl font-semibold text-slate-100">{data.certifications.length}</p>
          </article>
          <article className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
            <h2 className="flex items-center gap-2 text-sm font-medium text-slate-300">
              <FileText className="h-4 w-4 text-sky-400" />
              Writeups públicos
            </h2>
            <p className="mt-2 text-3xl font-semibold text-slate-100">{data.writeups.length}</p>
          </article>
        </section>

        <section className="mt-8 grid gap-6 xl:grid-cols-3">
          <article className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5 xl:col-span-2">
            <h3 className="text-lg font-semibold text-slate-100">Proyectos Destacados</h3>
            {data.projects.length === 0 ? (
              <p className="mt-3 text-sm text-slate-500">Aún no hay proyectos públicos cargados.</p>
            ) : (
              <div className="mt-4 grid gap-3">
                {data.projects.map((project) => (
                  <div key={project.id} className="rounded-xl border border-slate-800 bg-slate-950/55 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <h4 className="text-sm font-medium text-slate-100">{project.name}</h4>
                      <span className="rounded-full bg-sky-900/50 px-2 py-0.5 text-xs text-sky-300">
                        {project.status}
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {project.technologies.map((tech) => (
                        <span
                          key={`${project.id}-${tech}`}
                          className="rounded-full border border-slate-700 px-2 py-0.5 text-xs text-slate-300"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                    {project.evidenceUrl ? (
                      <a
                        href={project.evidenceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-3 inline-flex items-center gap-1 text-xs text-sky-300 hover:text-sky-200"
                      >
                        Evidencia <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </article>

          <article className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
            <h3 className="text-lg font-semibold text-slate-100">Tecnologías</h3>
            <div className="mt-4 flex flex-wrap gap-2">
              {data.technologies.length === 0 ? (
                <p className="text-sm text-slate-500">Sin tecnologías registradas todavía.</p>
              ) : (
                data.technologies.map((tech) => (
                  <span
                    key={tech.name}
                    className="rounded-full border border-sky-700/40 bg-sky-900/30 px-2.5 py-1 text-xs text-sky-200"
                  >
                    {tech.name} ({tech.count})
                  </span>
                ))
              )}
            </div>
          </article>
        </section>

        <section className="mt-8 grid gap-6 xl:grid-cols-2">
          <article className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
            <h3 className="text-lg font-semibold text-slate-100">Certificaciones</h3>
            {data.certifications.length === 0 ? (
              <p className="mt-3 text-sm text-slate-500">Sin certificaciones para mostrar.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {data.certifications.map((certification) => (
                  <li key={certification.id} className="rounded-xl border border-slate-800 bg-slate-950/55 p-3">
                    <p className="text-sm font-medium text-slate-100">{certification.name}</p>
                    <p className="text-xs text-slate-400">{certification.provider}</p>
                    <p className="mt-1 text-xs text-sky-300">
                      Estado: {certification.status} · Progreso: {certification.progress}%
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </article>

          <article className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
            <h3 className="text-lg font-semibold text-slate-100">Timeline Profesional</h3>
            {data.timeline.length === 0 ? (
              <p className="mt-3 text-sm text-slate-500">Sin eventos registrados.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {data.timeline.map((event, idx) => (
                  <li key={`${event.date}-${idx}`} className="flex items-start gap-3">
                    <span className="mt-1 h-2 w-2 rounded-full bg-sky-400" />
                    <div>
                      <p className="text-sm text-slate-200">{event.title}</p>
                      <p className="text-xs text-slate-500">{formatDate(event.date)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </article>
        </section>

        <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
          <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-100">
            <Sparkles className="h-4 w-4 text-sky-400" />
            Writeups Públicos
          </h3>
          {data.writeups.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">No hay writeups públicos publicados todavía.</p>
          ) : (
            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {data.writeups.map((writeup) => (
                <article key={writeup.id} className="rounded-xl border border-slate-800 bg-slate-950/55 p-4">
                  <p className="text-sm font-medium text-slate-100">{writeup.title}</p>
                  <p className="mt-1 text-xs text-slate-400">{writeup.category}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {writeup.tags.map((tag) => (
                      <span key={`${writeup.id}-${tag}`} className="rounded bg-slate-800 px-2 py-0.5 text-[11px] text-slate-300">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
