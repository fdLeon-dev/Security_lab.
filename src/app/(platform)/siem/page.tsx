export default function SiemPage() {
  return (
    <main>
      <h1 className="text-3xl font-semibold text-slate-100">SIEM Academy</h1>
      <p className="mt-2 text-sm text-slate-400">Laboratorio académico para eventos, reglas y alertas simuladas.</p>

      <section className="mt-6 grid gap-4 md:grid-cols-2">
        <article className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
          <h2 className="text-lg font-semibold">Eventos simulados</h2>
          <p className="mt-2 text-sm text-slate-400">Crea eventos y clasifícalos por severidad, fuente y tipo.</p>
        </article>
        <article className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
          <h2 className="text-lg font-semibold">Reglas y casos de uso</h2>
          <p className="mt-2 text-sm text-slate-400">Define reglas de detección y activa alertas de entrenamiento.</p>
        </article>
      </section>
    </main>
  );
}
