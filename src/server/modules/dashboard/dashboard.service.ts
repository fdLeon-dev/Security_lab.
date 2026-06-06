import { RecordStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function getDashboardMetrics(userId: string) {
  const now = new Date();
  const currentYear = now.getUTCFullYear();
  const yearStart = new Date(Date.UTC(currentYear, 0, 1));
  const recentWindowStart = new Date(now.getTime() - 1000 * 60 * 60 * 24 * 45);

  const [studySessions, goalsCompleted, certifications, labsCompleted, activeProjects, courses, coursesCompleted, coursesActive, studySessionsRecent, certificationsRecent, labsRecent, goalsRecent] = await Promise.all([
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
    prisma.learningCourse.count({
      where: { userId, status: RecordStatus.COMPLETED },
    }),
    prisma.learningCourse.count({
      where: { userId, status: RecordStatus.IN_PROGRESS },
    }),
    prisma.studySession.findMany({
      where: { userId, startedAt: { gte: recentWindowStart } },
      select: { id: true, focusArea: true, startedAt: true, minutes: true },
      orderBy: { startedAt: "desc" },
      take: 6,
    }),
    prisma.certification.findMany({
      where: { userId },
      select: { id: true, name: true, status: true, updatedAt: true, progress: true },
      orderBy: { updatedAt: "desc" },
      take: 4,
    }),
    prisma.labEntry.findMany({
      where: { userId },
      select: { id: true, title: true, status: true, updatedAt: true, category: true },
      orderBy: { updatedAt: "desc" },
      take: 4,
    }),
    prisma.goal.findMany({
      where: { userId },
      select: { id: true, title: true, status: true, updatedAt: true, progress: true },
      orderBy: { updatedAt: "desc" },
      take: 4,
    }),
  ]);

  const monthLabels = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (5 - index), 1));
    return {
      key: `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`,
      label: date.toLocaleString("en-US", { month: "short" }),
    };
  });

  const monthlyStudyHoursMap = new Map<string, number>();
  studySessionsRecent.forEach((session) => {
    const key = `${session.startedAt.getUTCFullYear()}-${String(session.startedAt.getUTCMonth() + 1).padStart(2, "0")}`;
    monthlyStudyHoursMap.set(key, (monthlyStudyHoursMap.get(key) ?? 0) + session.minutes / 60);
  });

  const monthlyCertificationsMap = new Map<string, number>();
  certificationsRecent.forEach((certification) => {
    const key = `${certification.updatedAt.getUTCFullYear()}-${String(certification.updatedAt.getUTCMonth() + 1).padStart(2, "0")}`;
    monthlyCertificationsMap.set(key, (monthlyCertificationsMap.get(key) ?? 0) + 1);
  });

  const monthlyLabsMap = new Map<string, number>();
  labsRecent.forEach((lab) => {
    const key = `${lab.updatedAt.getUTCFullYear()}-${String(lab.updatedAt.getUTCMonth() + 1).padStart(2, "0")}`;
    monthlyLabsMap.set(key, (monthlyLabsMap.get(key) ?? 0) + (lab.status === RecordStatus.COMPLETED ? 1 : 0));
  });

  const recentActivity = [
    ...studySessionsRecent.map((session) => ({
      id: `study-${session.id}`,
      title: session.focusArea,
      type: "Study session",
      detail: `${Number((session.minutes / 60).toFixed(1))}h logged`,
      date: session.startedAt,
    })),
    ...certificationsRecent.map((certification) => ({
      id: `cert-${certification.id}`,
      title: certification.name,
      type: "Certification",
      detail: `${certification.progress}% · ${certification.status}`,
      date: certification.updatedAt,
    })),
    ...labsRecent.map((lab) => ({
      id: `lab-${lab.id}`,
      title: lab.title,
      type: "Lab",
      detail: `${lab.category} · ${lab.status}`,
      date: lab.updatedAt,
    })),
    ...goalsRecent.map((goal) => ({
      id: `goal-${goal.id}`,
      title: goal.title,
      type: "Goal",
      detail: `${goal.progress}% · ${goal.status}`,
      date: goal.updatedAt,
    })),
  ]
    .sort((left, right) => right.date.getTime() - left.date.getTime())
    .slice(0, 8)
    .map((item) => ({
      ...item,
      date: item.date.toISOString(),
    }));

  const monthlySummaryStudyMinutes = await prisma.studySession.aggregate({
    where: {
      userId,
      startedAt: {
        gte: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)),
      },
    },
    _sum: { minutes: true },
  });

  const [monthlyLabsCompleted, monthlyCertificationsUpdated] = await Promise.all([
    prisma.labEntry.count({
      where: {
        userId,
        status: RecordStatus.COMPLETED,
        completedAt: {
          gte: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)),
        },
      },
    }),
    prisma.certification.count({
      where: {
        userId,
        updatedAt: {
          gte: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)),
        },
      },
    }),
  ]);

  const [annualStudyMinutes, annualLabsCompleted, annualCertificationsCompleted, annualGoalsCompleted] = await Promise.all([
    prisma.studySession.aggregate({
      where: { userId, startedAt: { gte: yearStart } },
      _sum: { minutes: true },
    }),
    prisma.labEntry.count({
      where: {
        userId,
        status: RecordStatus.COMPLETED,
        completedAt: { gte: yearStart },
      },
    }),
    prisma.certification.count({
      where: {
        userId,
        status: RecordStatus.COMPLETED,
        completionDate: { gte: yearStart },
      },
    }),
    prisma.goal.count({
      where: {
        userId,
        status: RecordStatus.COMPLETED,
        updatedAt: { gte: yearStart },
      },
    }),
  ]);

  return {
    totalStudyHours: Number(((studySessions._sum.minutes ?? 0) / 60).toFixed(1)),
    activeCourses: coursesActive,
    completedCourses: coursesCompleted,
    goalsCompleted,
    certifications,
    labsCompleted,
    activeProjects,
    courses,
    monthlyEvolution: monthLabels.map((month) => ({
      label: month.label,
      studyHours: Number((monthlyStudyHoursMap.get(month.key) ?? 0).toFixed(1)),
      certifications: monthlyCertificationsMap.get(month.key) ?? 0,
      labsCompleted: monthlyLabsMap.get(month.key) ?? 0,
    })),
    recentActivity,
    monthlySummary: {
      studyHours: Number((((monthlySummaryStudyMinutes._sum.minutes ?? 0) / 60)).toFixed(1)),
      certifications: monthlyCertificationsUpdated,
      labsCompleted: monthlyLabsCompleted,
    },
    annualProgress: {
      year: currentYear,
      studyHours: Number((((annualStudyMinutes._sum.minutes ?? 0) / 60)).toFixed(1)),
      certificationsCompleted: annualCertificationsCompleted,
      labsCompleted: annualLabsCompleted,
      goalsCompleted: annualGoalsCompleted,
    },
  };
}
