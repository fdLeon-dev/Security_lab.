const toolkit = [
  "DNS Lookup",
  "WHOIS",
  "Verificación SSL",
  "Conversores",
  "Analizador de Logs",
  "Generador de Reportes",
];

export default function ToolkitPage() {
  return (
    <main>
      <h1 className="text-3xl font-semibold text-slate-100">Cybersecurity Toolkit</h1>
      <p className="mt-2 text-sm text-slate-400">
        Herramientas exclusivamente defensivas y educativas para análisis y documentación.
      </p>

      <section className="mt-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-100">
        Este módulo no implementa capacidades ofensivas ni de explotación.
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {toolkit.map((tool) => (
          <article key={tool} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
            <h2 className="text-lg font-semibold text-slate-100">{tool}</h2>
            <p className="mt-2 text-sm text-slate-400">Uso académico, auditoría local y exportación de resultados.</p>
          </article>
        ))}
      </section>
    </main>
  );
}
