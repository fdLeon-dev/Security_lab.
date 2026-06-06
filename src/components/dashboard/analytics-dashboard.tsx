import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { BarChartCard } from "@/components/dashboard/bar-chart-card";
import { MetricCard } from "@/components/dashboard/metric-card";

type DashboardData = {
  totalStudyHours: number;
  activeCourses: number;
  completedCourses: number;
  goalsCompleted: number;
  certifications: number;
  labsCompleted: number;
  activeProjects: number;
  courses: Array<{ title: string; progress: number }>;
  monthlyEvolution: Array<{
    label: string;
    studyHours: number;
    certifications: number;
    labsCompleted: number;
  }>;
  recentActivity: Array<{
    id: string;
    title: string;
    type: string;
    detail: string;
    date: string;
  }>;
  monthlySummary: {
    studyHours: number;
    certifications: number;
    labsCompleted: number;
  };
  annualProgress: {
    year: number;
    studyHours: number;
    certificationsCompleted: number;
    labsCompleted: number;
    goalsCompleted: number;
  };
};

export function AnalyticsDashboard({ data }: { data: DashboardData }) {
  return (
    <div className="mt-6 space-y-6">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <MetricCard label="Horas estudiadas" value={data.totalStudyHours} helper="Acumulado total" />
        <MetricCard label="Cursos activos" value={data.activeCourses} helper="Seguimiento actual" />
        <MetricCard label="Cursos completados" value={data.completedCourses} helper="Histórico finalizado" />
        <MetricCard label="Certificaciones" value={data.certifications} helper="Plan registrado" />
        <MetricCard label="Labs completados" value={data.labsCompleted} helper="Entregables técnicos" />
        <MetricCard label="Objetivos" value={data.goalsCompleted} helper="Metas completadas" />
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <BarChartCard
          title="Evolución mensual"
          description="Horas estudiadas por mes reciente."
          data={data.monthlyEvolution.map((item) => ({ label: item.label, value: item.studyHours, tone: "sky" }))}
        />
        <BarChartCard
          title="Certificaciones"
          description="Actividad mensual asociada a certificaciones."
          data={data.monthlyEvolution.map((item) => ({ label: item.label, value: item.certifications, tone: "amber" }))}
        />
        <BarChartCard
          title="Labs completados"
          description="Cierre mensual de laboratorios."
          data={data.monthlyEvolution.map((item) => ({ label: item.label, value: item.labsCompleted, tone: "emerald" }))}
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <ActivityFeed
          items={data.recentActivity.map((item) => ({
            ...item,
            date: new Date(item.date).toLocaleString(),
          }))}
        />
        <div className="space-y-4">
          <article className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
            <h2 className="text-lg font-semibold text-slate-100">Resumen mensual</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              <MetricCard label="Horas" value={data.monthlySummary.studyHours} />
              <MetricCard label="Certificaciones" value={data.monthlySummary.certifications} />
              <MetricCard label="Labs" value={data.monthlySummary.labsCompleted} />
            </div>
          </article>
          <article className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
            <h2 className="text-lg font-semibold text-slate-100">Progreso anual {data.annualProgress.year}</h2>
            <div className="mt-4 space-y-4">
              <div>
                <div className="mb-2 flex items-center justify-between text-sm text-slate-300">
                  <span>Horas estudiadas</span>
                  <span>{data.annualProgress.studyHours}</span>
                </div>
                <div className="h-2 rounded-full bg-slate-800"><div className="h-full rounded-full bg-sky-400" style={{ width: `${Math.min(data.annualProgress.studyHours, 200) / 2}%` }} /></div>
              </div>
              <div>
                <div className="mb-2 flex items-center justify-between text-sm text-slate-300">
                  <span>Certificaciones completadas</span>
                  <span>{data.annualProgress.certificationsCompleted}</span>
                </div>
                <div className="h-2 rounded-full bg-slate-800"><div className="h-full rounded-full bg-amber-400" style={{ width: `${Math.min(data.annualProgress.certificationsCompleted, 10) * 10}%` }} /></div>
              </div>
              <div>
                <div className="mb-2 flex items-center justify-between text-sm text-slate-300">
                  <span>Labs completados</span>
                  <span>{data.annualProgress.labsCompleted}</span>
                </div>
                <div className="h-2 rounded-full bg-slate-800"><div className="h-full rounded-full bg-emerald-400" style={{ width: `${Math.min(data.annualProgress.labsCompleted, 50) * 2}%` }} /></div>
              </div>
              <div>
                <div className="mb-2 flex items-center justify-between text-sm text-slate-300">
                  <span>Objetivos completados</span>
                  <span>{data.annualProgress.goalsCompleted}</span>
                </div>
                <div className="h-2 rounded-full bg-slate-800"><div className="h-full rounded-full bg-cyan-400" style={{ width: `${Math.min(data.annualProgress.goalsCompleted, 20) * 5}%` }} /></div>
              </div>
            </div>
          </article>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
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
    </div>
  );
}
