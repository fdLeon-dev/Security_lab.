import { LabManager } from "@/components/labs/lab-manager";

export default function LabsPage() {
  return (
    <main>
      <h1 className="text-3xl font-semibold text-slate-100">Lab Manager</h1>
      <p className="mt-2 text-sm text-slate-400">CRUD completo de laboratorios con tabla, dashboard analítico, búsqueda, filtros y ordenación.</p>
      <LabManager />
    </main>
  );
}
