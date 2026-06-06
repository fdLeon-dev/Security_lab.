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
      goalsCompleted: 14,
      certifications: 3,
      labsCompleted: 29,
      activeProjects: 4,
      courses: [
        { title: "Fundamentos Cyber de Linux", progress: 52 },
        { title: "SIEM Básico", progress: 38 },
      ],
    });
  }
}
