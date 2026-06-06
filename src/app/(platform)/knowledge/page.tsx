const categories = [
  "Linux",
  "Windows",
  "Redes",
  "SQL",
  "Python",
  "JavaScript",
  "React",
  "SIEM",
  "IDS",
  "Firewall",
  "OWASP",
  "Cloud",
  "DevSecOps",
];

export default function KnowledgePage() {
  return (
    <main>
      <h1 className="text-3xl font-semibold text-slate-100">Knowledge Hub</h1>
      <p className="mt-2 text-sm text-slate-400">
        Base de conocimiento estilo Obsidian/Notion con categorías técnicas, enlaces internos y Markdown.
      </p>

      <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
        <h2 className="text-lg font-semibold">Categorías</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {categories.map((category) => (
            <span key={category} className="rounded-full border border-slate-700 bg-slate-950/80 px-3 py-1 text-xs text-slate-200">
              {category}
            </span>
          ))}
        </div>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-2">
        <article className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
          <h3 className="font-semibold">Búsqueda avanzada</h3>
          <p className="mt-2 text-sm text-slate-400">Filtra por etiqueta, categoría, palabra clave y enlaces relacionados.</p>
        </article>
        <article className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
          <h3 className="font-semibold">Bloques enriquecidos</h3>
          <p className="mt-2 text-sm text-slate-400">Soporte para código, imágenes, listas, callouts y referencias cruzadas.</p>
        </article>
      </section>
    </main>
  );
}
