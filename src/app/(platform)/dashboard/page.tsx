import { MetricCard } from "@/components/dashboard/metric-card";
import { getDashboardMetrics } from "@/server/modules/dashboard/dashboard.service";
import { getDefaultUserId } from "@/server/core/default-user";

export const dynamic = "force-dynamic";

type DashboardPayload = {
  totalStudyHours: number;
  goalsCompleted: number;
  certifications: number;
  labsCompleted: number;
  activeProjects: number;
  courses: Array<{ title: string; progress: number }>;
};

async function getDashboardData(): Promise<DashboardPayload> {
  try {
    const userId = await getDefaultUserId();
    return await getDashboardMetrics(userId);
  } catch {
    return {
      totalStudyHours: 122,
      goalsCompleted: 14,
      certifications: 3,
      labsCompleted: 29,
      activeProjects: 4,
      courses: [
        { title: "Fundamentos Cyber de Linux", progress: 52 },
        { title: "SIEM Básico", progress: 38 },
      ],
    };
  }
}

export default async function DashboardPage() {
  const data = await getDashboardData();

  return (
    <main>
      <h1 className="text-3xl font-semibold text-slate-100">Dashboard Central</h1>
      <p className="mt-2 text-sm text-slate-400">Visión integral de progreso académico, técnico y profesional.</p>

      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard label="Horas estudiadas" value={data.totalStudyHours} helper="Total acumulado" />
        <MetricCard label="Objetivos completados" value={data.goalsCompleted} />
        <MetricCard label="Certificaciones" value={data.certifications} />
        <MetricCard label="Labs completados" value={data.labsCompleted} />
        <MetricCard label="Proyectos activos" value={data.activeProjects} />
      </section>

      <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
        <h2 className="text-lg font-semibold text-slate-100">Cursos en progreso</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {data.courses.map((course) => (
            <article key={course.title} className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
              <p className="text-sm text-slate-200">{course.title}</p>
              <div className="mt-2 h-2 rounded-full bg-slate-800">
                <div className="h-full rounded-full bg-sky-400" style={{ width: `${course.progress}%` }} />
              </div>
              <p className="mt-2 text-xs text-slate-400">{course.progress}% completado</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
