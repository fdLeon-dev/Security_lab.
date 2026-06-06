import { SiemAcademy } from "@/components/siem/siem-academy";

export default function SiemPage() {
  return (
    <main>
      <h1 className="text-3xl font-semibold text-slate-100">SIEM Academy</h1>
      <p className="mt-2 text-sm text-slate-400">Módulo académico para monitoreo, clasificación y análisis conceptual de eventos.</p>
      <SiemAcademy />
    </main>
  );
}
