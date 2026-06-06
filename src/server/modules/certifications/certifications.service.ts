import { Prisma, RecordStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { sanitizeText } from "@/lib/security";

export type CertificationFilters = {
  search?: string;
  status?: RecordStatus;
  provider?: string;
  sortBy?: "updatedAt" | "createdAt" | "targetDate" | "progress" | "name";
  sortOrder?: "asc" | "desc";
};

export type CertificationInput = {
  name: string;
  provider: string;
  status: RecordStatus;
  startDate?: Date | null;
  targetDate?: Date | null;
  completionDate?: Date | null;
  progress: number;
  notes?: string | null;
  evidenceUrl?: string | null;
};

function buildWhere(userId: string, filters: CertificationFilters): Prisma.CertificationWhereInput {
  return {
    userId,
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.provider ? { provider: filters.provider } : {}),
    ...(filters.search
      ? {
          OR: [
            { name: { contains: filters.search, mode: "insensitive" } },
            { provider: { contains: filters.search, mode: "insensitive" } },
            { notes: { contains: filters.search, mode: "insensitive" } },
          ],
        }
      : {}),
  };
}

function getOrderBy(filters: CertificationFilters): Prisma.CertificationOrderByWithRelationInput {
  return {
    [filters.sortBy ?? "updatedAt"]: filters.sortOrder ?? "desc",
  };
}

function normalizeCompletionDate(status: RecordStatus, completionDate?: Date | null) {
  if (status === RecordStatus.COMPLETED) {
    return completionDate ?? new Date();
  }

  return null;
}

export async function listCertifications(userId: string, filters: CertificationFilters = {}) {
  return prisma.certification.findMany({
    where: buildWhere(userId, filters),
    orderBy: getOrderBy(filters),
    take: 100,
  });
}

export async function getCertificationById(userId: string, id: string) {
  return prisma.certification.findFirst({
    where: { id, userId },
  });
}

export async function createCertification(userId: string, input: CertificationInput) {
  return prisma.certification.create({
    data: {
      userId,
      name: sanitizeText(input.name),
      provider: sanitizeText(input.provider),
      status: input.status,
      startDate: input.startDate ?? null,
      targetDate: input.targetDate ?? null,
      completionDate: normalizeCompletionDate(input.status, input.completionDate),
      progress: Math.max(0, Math.min(100, input.progress)),
      notes: input.notes ? sanitizeText(input.notes) : null,
      evidenceUrl: input.evidenceUrl ? input.evidenceUrl.trim() : null,
    },
  });
}

export async function updateCertification(userId: string, id: string, input: Partial<CertificationInput>) {
  const current = await getCertificationById(userId, id);
  if (!current) {
    return null;
  }

  const nextStatus = input.status ?? current.status;

  return prisma.certification.update({
    where: { id },
    data: {
      ...(input.name ? { name: sanitizeText(input.name) } : {}),
      ...(input.provider ? { provider: sanitizeText(input.provider) } : {}),
      ...(input.status ? { status: input.status } : {}),
      ...(input.startDate !== undefined ? { startDate: input.startDate } : {}),
      ...(input.targetDate !== undefined ? { targetDate: input.targetDate } : {}),
      completionDate: normalizeCompletionDate(nextStatus, input.completionDate ?? current.completionDate),
      ...(input.progress !== undefined ? { progress: Math.max(0, Math.min(100, input.progress)) } : {}),
      ...(input.notes !== undefined ? { notes: input.notes ? sanitizeText(input.notes) : null } : {}),
      ...(input.evidenceUrl !== undefined ? { evidenceUrl: input.evidenceUrl ? input.evidenceUrl.trim() : null } : {}),
    },
  });
}

export async function deleteCertification(userId: string, id: string) {
  const current = await getCertificationById(userId, id);
  if (!current) {
    return null;
  }

  return prisma.certification.delete({
    where: { id },
  });
}

export async function getCertificationDashboard(userId: string, filters: CertificationFilters = {}) {
  const where = buildWhere(userId, filters);
  const now = new Date();

  const [total, completed, inProgress, avgProgress, upcoming] = await Promise.all([
    prisma.certification.count({ where }),
    prisma.certification.count({ where: { ...where, status: RecordStatus.COMPLETED } }),
    prisma.certification.count({ where: { ...where, status: RecordStatus.IN_PROGRESS } }),
    prisma.certification.aggregate({ where, _avg: { progress: true } }),
    prisma.certification.findMany({
      where: {
        ...where,
        targetDate: { gte: now },
        status: { not: RecordStatus.COMPLETED },
      },
      orderBy: { targetDate: "asc" },
      take: 3,
      select: {
        id: true,
        name: true,
        targetDate: true,
        progress: true,
      },
    }),
  ]);

  return {
    total,
    completed,
    inProgress,
    averageProgress: Math.round(avgProgress._avg.progress ?? 0),
    upcoming,
  };
}
