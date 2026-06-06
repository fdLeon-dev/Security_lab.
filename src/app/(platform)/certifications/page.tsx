import { CertificationTracker } from "@/components/certifications/certification-tracker";

export default function CertificationsPage() {
  return (
    <main>
      <h1 className="text-3xl font-semibold text-slate-100">Certification Tracker</h1>
      <p className="mt-2 text-sm text-slate-400">CRUD completo con seguimiento de progreso, fechas objetivo, evidencias y dashboard propio.</p>
      <CertificationTracker />
    </main>
  );
}
