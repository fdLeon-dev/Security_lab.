import { RecordStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function listLabEntries(userId: string) {
  return prisma.labEntry.findMany({
    where: { userId },
    orderBy: { date: "desc" },
    take: 20,
  });
}

export async function getLabStats(userId: string) {
  const [completed, inProgress, total] = await Promise.all([
    prisma.labEntry.count({ where: { userId, status: RecordStatus.COMPLETED } }),
    prisma.labEntry.count({ where: { userId, status: RecordStatus.IN_PROGRESS } }),
    prisma.labEntry.count({ where: { userId } }),
  ]);

  return { completed, inProgress, total };
}
