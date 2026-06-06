const certs = ["Security+", "eJPT", "PNPT", "Google Cybersecurity", "Cisco", "Azure"];

export default function CertificationsPage() {
  return (
    <main>
      <h1 className="text-3xl font-semibold text-slate-100">Certification Tracker</h1>
      <p className="mt-2 text-sm text-slate-400">Ruta de certificaciones con progreso, fechas y evidencias de preparación.</p>

      <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {certs.map((cert) => (
          <article key={cert} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
            <h2 className="text-lg font-semibold text-slate-100">{cert}</h2>
            <p className="mt-2 text-sm text-slate-400">Estado, hitos de estudio y adjuntos de evidencia.</p>
          </article>
        ))}
      </section>
    </main>
  );
}
