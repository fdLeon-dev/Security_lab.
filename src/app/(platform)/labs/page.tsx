const platforms = ["Hack The Box", "TryHackMe", "PortSwigger", "Docker Labs", "Laboratorios propios"];

export default function LabsPage() {
  return (
    <main>
      <h1 className="text-3xl font-semibold text-slate-100">Lab Manager</h1>
      <p className="mt-2 text-sm text-slate-400">Registro histórico de laboratorios con evolución, dificultad y resultados.</p>

      <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {platforms.map((platform) => (
          <article key={platform} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
            <h2 className="text-lg font-semibold text-slate-100">{platform}</h2>
            <p className="mt-2 text-sm text-slate-400">Análisis de desempeño por categoría, tiempo y dificultad.</p>
          </article>
        ))}
      </section>
    </main>
  );
}
