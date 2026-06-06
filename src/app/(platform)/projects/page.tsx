const projects = [
  "Portfolio",
  "Devices Security Lab",
  "Scripts Python",
  "Herramientas Defensivas",
  "Aplicaciones Web",
];

export default function ProjectsPage() {
  return (
    <main>
      <h1 className="text-3xl font-semibold text-slate-100">Project Management</h1>
      <p className="mt-2 text-sm text-slate-400">Gestión estratégica de proyectos técnicos y portafolio profesional.</p>

      <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {projects.map((project) => (
          <article key={project} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
            <h2 className="text-lg font-semibold text-slate-100">{project}</h2>
            <p className="mt-2 text-sm text-slate-400">Incluye prioridad, estado, tecnologías y evidencias.</p>
          </article>
        ))}
      </section>
    </main>
  );
}
