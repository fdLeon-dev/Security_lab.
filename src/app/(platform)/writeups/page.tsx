export default function WriteupsPage() {
  return (
    <main>
      <h1 className="text-3xl font-semibold text-slate-100">Writeup Center</h1>
      <p className="mt-2 text-sm text-slate-400">Documentación técnica profesional con soporte Markdown, MDX, diagramas y código.</p>

      <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
        <h2 className="text-lg font-semibold">Categorías técnicas</h2>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {["Linux", "Windows", "Redes", "Web", "Active Directory", "Cloud"].map((item) => (
            <div key={item} className="rounded-lg border border-slate-800 bg-slate-950/60 p-3 text-sm text-slate-200">
              {item}
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
