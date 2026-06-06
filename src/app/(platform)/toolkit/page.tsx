import { ToolkitDashboard } from "@/components/toolkit/toolkit-dashboard";

export default function ToolkitPage() {
  return (
    <main className="space-y-6">
      <header>
        <h1 className="text-3xl font-semibold text-slate-100">Cybersecurity Toolkit</h1>
        <p className="mt-2 text-sm text-slate-400">
          Herramientas exclusivamente defensivas y educativas para análisis y documentación.
        </p>
      </header>

      <section className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-100">
        Este módulo no implementa capacidades ofensivas ni de explotación. Uso estrictamente académico.
      </section>

      <ToolkitDashboard />
    </main>
  );
}
