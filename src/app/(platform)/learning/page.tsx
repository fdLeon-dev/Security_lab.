const courses = [
  "Fundamentos Cyber de Windows",
  "Fundamentos Cyber de Linux",
  "Fundamentos Cyber de Redes",
  "Fundamentos Cyber de Bases de Datos",
  "Programación y Servidores Web",
  "Firewall e IDS",
  "SIEM",
];

export default function LearningPage() {
  return (
    <main>
      <h1 className="text-3xl font-semibold text-slate-100">Learning Tracker</h1>
      <p className="mt-2 text-sm text-slate-400">Control de cursos, módulos, lecciones, tiempo invertido y rendimiento.</p>

      <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {courses.map((course, index) => (
          <article key={course} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
            <p className="text-sm uppercase tracking-wide text-slate-400">Curso {index + 1}</p>
            <h2 className="mt-1 text-lg font-semibold text-slate-100">{course}</h2>
            <p className="mt-2 text-sm text-slate-400">Progreso, notas y lecciones disponibles en la vista detallada.</p>
          </article>
        ))}
      </section>
    </main>
  );
}
