import {
  Difficulty,
  LabCategory,
  LabPlatform,
  Prisma,
  RecordStatus,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { sanitizeText } from "@/lib/security";

export type LabFilters = {
  search?: string;
  platform?: LabPlatform;
  category?: LabCategory;
  difficulty?: Difficulty;
  status?: RecordStatus;
  sortBy?: "createdAt" | "updatedAt" | "completedAt" | "title" | "difficulty";
  sortOrder?: "asc" | "desc";
};

export type LabInput = {
  title: string;
  platform: LabPlatform;
  category: LabCategory;
  difficulty: Difficulty;
  status: RecordStatus;
  notes?: string | null;
  completedAt?: Date | null;
};

function buildLabWhere(userId: string, filters: LabFilters): Prisma.LabEntryWhereInput {
  return {
    userId,
    ...(filters.platform ? { platform: filters.platform } : {}),
    ...(filters.category ? { category: filters.category } : {}),
    ...(filters.difficulty ? { difficulty: filters.difficulty } : {}),
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.search
      ? {
          OR: [
            { title: { contains: filters.search, mode: "insensitive" } },
            { notes: { contains: filters.search, mode: "insensitive" } },
          ],
        }
      : {}),
  };
}

function getOrderBy(filters: LabFilters): Prisma.LabEntryOrderByWithRelationInput {
  const field = filters.sortBy ?? "updatedAt";
  const direction = filters.sortOrder ?? "desc";
  return { [field]: direction };
}

function normalizeCompletedAt(status: RecordStatus, completedAt?: Date | null) {
  if (status === RecordStatus.COMPLETED) {
    return completedAt ?? new Date();
  }

  return null;
}

export async function listLabEntries(userId: string, filters: LabFilters = {}) {
  return prisma.labEntry.findMany({
    where: buildLabWhere(userId, filters),
    orderBy: getOrderBy(filters),
    take: 100,
  });
}

export async function getLabById(userId: string, id: string) {
  return prisma.labEntry.findFirst({
    where: { id, userId },
  });
}

export async function createLab(userId: string, input: LabInput) {
  return prisma.labEntry.create({
    data: {
      userId,
      title: sanitizeText(input.title),
      platform: input.platform,
      category: input.category,
      difficulty: input.difficulty,
      status: input.status,
      notes: input.notes ? sanitizeText(input.notes) : null,
      completedAt: normalizeCompletedAt(input.status, input.completedAt),
    },
  });
}

export async function updateLab(userId: string, id: string, input: Partial<LabInput>) {
  const current = await getLabById(userId, id);
  if (!current) {
    return null;
  }

  const nextStatus = input.status ?? current.status;

  return prisma.labEntry.update({
    where: { id },
    data: {
      ...(input.title ? { title: sanitizeText(input.title) } : {}),
      ...(input.platform ? { platform: input.platform } : {}),
      ...(input.category ? { category: input.category } : {}),
      ...(input.difficulty ? { difficulty: input.difficulty } : {}),
      ...(input.status ? { status: input.status } : {}),
      ...(input.notes !== undefined ? { notes: input.notes ? sanitizeText(input.notes) : null } : {}),
      completedAt: normalizeCompletedAt(nextStatus, input.completedAt ?? current.completedAt),
    },
  });
}

export async function deleteLab(userId: string, id: string) {
  const current = await getLabById(userId, id);
  if (!current) {
    return null;
  }

  return prisma.labEntry.delete({
    where: { id },
  });
}

export async function getLabStats(userId: string, filters: LabFilters = {}) {
  const where = buildLabWhere(userId, filters);

  const [completed, pending, total, byCategory, byDifficulty] = await Promise.all([
    prisma.labEntry.count({ where: { userId, status: RecordStatus.COMPLETED } }),
    prisma.labEntry.count({
      where: {
        ...where,
        status: {
          not: RecordStatus.COMPLETED,
        },
      },
    }),
    prisma.labEntry.count({ where }),
    prisma.labEntry.groupBy({
      by: ["category"],
      where,
      _count: { _all: true },
      orderBy: { _count: { category: "desc" } },
    }),
    prisma.labEntry.groupBy({
      by: ["difficulty"],
      where,
      _count: { _all: true },
      orderBy: { _count: { difficulty: "desc" } },
    }),
  ]);

  return {
    completed,
    pending,
    total,
    byCategory: byCategory.map((item) => ({
      category: item.category,
      count: item._count._all,
    })),
    byDifficulty: byDifficulty.map((item) => ({
      difficulty: item.difficulty,
      count: item._count._all,
    })),
  };
}
