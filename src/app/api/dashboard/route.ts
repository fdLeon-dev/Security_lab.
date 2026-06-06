import { NextResponse } from "next/server";
import { getDashboardMetrics } from "@/server/modules/dashboard/dashboard.service";
import { getDefaultUserId } from "@/server/core/default-user";

export async function GET() {
  try {
    const userId = await getDefaultUserId();
    const data = await getDashboardMetrics(userId);
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({
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
    });
  }
}
