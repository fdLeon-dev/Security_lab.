import { RecordStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function getDashboardMetrics(userId: string) {
  const [studySessions, goals, certifications, labs, projects, courses] = await Promise.all([
    prisma.studySession.aggregate({
      where: { userId },
      _sum: { minutes: true },
    }),
    prisma.goal.count({
      where: { userId, status: RecordStatus.COMPLETED },
    }),
    prisma.certification.count({
      where: { userId },
    }),
    prisma.labEntry.count({
      where: { userId, status: RecordStatus.COMPLETED },
    }),
    prisma.project.count({
      where: { userId, status: RecordStatus.IN_PROGRESS },
    }),
    prisma.learningCourse.findMany({
      where: { userId },
      select: {
        title: true,
        progress: true,
      },
      take: 4,
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  return {
    totalStudyHours: Number(((studySessions._sum.minutes ?? 0) / 60).toFixed(1)),
    goalsCompleted: goals,
    certifications,
    labsCompleted: labs,
    activeProjects: projects,
    courses,
  };
}
