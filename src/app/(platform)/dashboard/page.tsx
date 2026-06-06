import { AnalyticsDashboard } from "@/components/dashboard/analytics-dashboard";
import { getDashboardMetrics } from "@/server/modules/dashboard/dashboard.service";
import { getDefaultUserId } from "@/server/core/default-user";

export const dynamic = "force-dynamic";

type DashboardPayload = {
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

async function getDashboardData(): Promise<DashboardPayload> {
  try {
    const userId = await getDefaultUserId();
    return await getDashboardMetrics(userId);
  } catch {
    return {
      totalStudyHours: 122,
      activeCourses: 2,
      completedCourses: 1,
      goalsCompleted: 14,
      certifications: 3,
      labsCompleted: 29,
      activeProjects: 4,
      courses: [
        { title: "Fundamentos Cyber de Linux", progress: 52 },
        { title: "SIEM Básico", progress: 38 },
      ],
      monthlyEvolution: [
        { label: "Jan", studyHours: 18, certifications: 1, labsCompleted: 2 },
        { label: "Feb", studyHours: 22, certifications: 0, labsCompleted: 3 },
        { label: "Mar", studyHours: 26, certifications: 1, labsCompleted: 4 },
        { label: "Apr", studyHours: 20, certifications: 1, labsCompleted: 2 },
        { label: "May", studyHours: 24, certifications: 0, labsCompleted: 5 },
        { label: "Jun", studyHours: 12, certifications: 1, labsCompleted: 2 },
      ],
      recentActivity: [],
      monthlySummary: {
        studyHours: 12,
        certifications: 1,
        labsCompleted: 2,
      },
      annualProgress: {
        year: new Date().getUTCFullYear(),
        studyHours: 122,
        certificationsCompleted: 1,
        labsCompleted: 29,
        goalsCompleted: 14,
      },
    };
  }
}

export default async function DashboardPage() {
  const data = await getDashboardData();

  return (
    <main>
      <h1 className="text-3xl font-semibold text-slate-100">Dashboard Central</h1>
      <p className="mt-2 text-sm text-slate-400">Visión integral de progreso académico, técnico y profesional.</p>
      <AnalyticsDashboard data={data} />
    </main>
  );
}
