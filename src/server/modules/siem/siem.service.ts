import { Prisma, SiemAlertStatus, SiemEventCategory } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { sanitizeText } from "@/lib/security";

export type PaginationInput = {
  page?: number;
  pageSize?: number;
};

export type SiemEventFilters = PaginationInput & {
  search?: string;
  category?: SiemEventCategory;
  severity?: number;
  sortBy?: "timestamp" | "createdAt" | "updatedAt" | "severity";
  sortOrder?: "asc" | "desc";
};

export type SiemRuleFilters = PaginationInput & {
  search?: string;
  severity?: number;
  enabled?: boolean;
  sortBy?: "createdAt" | "updatedAt" | "severity" | "name";
  sortOrder?: "asc" | "desc";
};

export type SiemAlertFilters = PaginationInput & {
  search?: string;
  status?: SiemAlertStatus;
  severity?: number;
  sortBy?: "createdAt" | "updatedAt" | "severity" | "title";
  sortOrder?: "asc" | "desc";
};

export type SiemEventInput = {
  source: string;
  category: SiemEventCategory;
  severity: number;
  timestamp: Date;
  description: string;
};

export type SiemRuleInput = {
  name: string;
  condition: string;
  severity: number;
  enabled?: boolean;
};

export type SiemAlertInput = {
  title: string;
  severity: number;
  status?: SiemAlertStatus;
  eventId: string;
  ruleId?: string | null;
};

function normalizePagination(input: PaginationInput = {}) {
  const page = Math.max(1, input.page ?? 1);
  const pageSize = Math.min(50, Math.max(5, input.pageSize ?? 10));
  return {
    page,
    pageSize,
    skip: (page - 1) * pageSize,
  };
}

function toDirection(order?: "asc" | "desc") {
  return order ?? "desc";
}

function buildEventWhere(userId: string, filters: SiemEventFilters): Prisma.SiemEventWhereInput {
  return {
    userId,
    ...(filters.category ? { category: filters.category } : {}),
    ...(filters.severity ? { severity: filters.severity } : {}),
    ...(filters.search
      ? {
          OR: [
            { source: { contains: filters.search, mode: "insensitive" } },
            { description: { contains: filters.search, mode: "insensitive" } },
          ],
        }
      : {}),
  };
}

function buildRuleWhere(userId: string, filters: SiemRuleFilters): Prisma.SiemRuleWhereInput {
  return {
    userId,
    ...(filters.enabled !== undefined ? { enabled: filters.enabled } : {}),
    ...(filters.severity ? { severity: filters.severity } : {}),
    ...(filters.search
      ? {
          OR: [
            { name: { contains: filters.search, mode: "insensitive" } },
            { condition: { contains: filters.search, mode: "insensitive" } },
          ],
        }
      : {}),
  };
}

function buildAlertWhere(userId: string, filters: SiemAlertFilters): Prisma.SiemAlertWhereInput {
  return {
    userId,
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.severity ? { severity: filters.severity } : {}),
    ...(filters.search
      ? {
          OR: [
            { title: { contains: filters.search, mode: "insensitive" } },
          ],
        }
      : {}),
  };
}

function normalizeSeverity(severity: number) {
  return Math.max(1, Math.min(10, severity));
}

function academicCategoryDefaults(category: SiemEventCategory) {
  switch (category) {
    case SiemEventCategory.AUTHENTICATION:
      return { severity: 5 };
    case SiemEventCategory.NETWORK:
      return { severity: 4 };
    case SiemEventCategory.SYSTEM:
      return { severity: 3 };
    case SiemEventCategory.APPLICATION:
      return { severity: 4 };
    case SiemEventCategory.ENDPOINT:
      return { severity: 6 };
    case SiemEventCategory.AUDIT:
      return { severity: 2 };
    default:
      return { severity: 4 };
  }
}

export async function listSiemEvents(userId: string, filters: SiemEventFilters = {}) {
  const pagination = normalizePagination(filters);
  const where = buildEventWhere(userId, filters);

  const [entries, total] = await Promise.all([
    prisma.siemEvent.findMany({
      where,
      include: {
        alerts: { select: { id: true, title: true, status: true } },
      },
      orderBy: { [filters.sortBy ?? "timestamp"]: toDirection(filters.sortOrder) },
      skip: pagination.skip,
      take: pagination.pageSize,
    }),
    prisma.siemEvent.count({ where }),
  ]);

  return { entries, total, page: pagination.page, pageSize: pagination.pageSize, totalPages: Math.max(1, Math.ceil(total / pagination.pageSize)) };
}

export async function getSiemEventById(userId: string, id: string) {
  return prisma.siemEvent.findFirst({
    where: { id, userId },
    include: { alerts: true },
  });
}

export async function createSiemEvent(userId: string, input: SiemEventInput) {
  const event = await prisma.siemEvent.create({
    data: {
      userId,
      source: sanitizeText(input.source),
      category: input.category,
      severity: normalizeSeverity(input.severity),
      timestamp: input.timestamp,
      description: sanitizeText(input.description),
    },
  });

  return classifyEvent(userId, event.id);
}

export async function updateSiemEvent(userId: string, id: string, input: Partial<SiemEventInput>) {
  const current = await getSiemEventById(userId, id);
  if (!current) {
    return null;
  }

  const updated = await prisma.siemEvent.update({
    where: { id },
    data: {
      ...(input.source ? { source: sanitizeText(input.source) } : {}),
      ...(input.category ? { category: input.category } : {}),
      ...(input.severity !== undefined ? { severity: normalizeSeverity(input.severity) } : {}),
      ...(input.timestamp ? { timestamp: input.timestamp } : {}),
      ...(input.description ? { description: sanitizeText(input.description) } : {}),
    },
  });

  return updated;
}

export async function deleteSiemEvent(userId: string, id: string) {
  const current = await getSiemEventById(userId, id);
  if (!current) {
    return null;
  }

  return prisma.siemEvent.delete({ where: { id } });
}

export async function listSiemRules(userId: string, filters: SiemRuleFilters = {}) {
  const pagination = normalizePagination(filters);
  const where = buildRuleWhere(userId, filters);

  const [entries, total] = await Promise.all([
    prisma.siemRule.findMany({
      where,
      orderBy: { [filters.sortBy ?? "updatedAt"]: toDirection(filters.sortOrder) },
      skip: pagination.skip,
      take: pagination.pageSize,
    }),
    prisma.siemRule.count({ where }),
  ]);

  return { entries, total, page: pagination.page, pageSize: pagination.pageSize, totalPages: Math.max(1, Math.ceil(total / pagination.pageSize)) };
}

export async function getSiemRuleById(userId: string, id: string) {
  return prisma.siemRule.findFirst({ where: { id, userId } });
}

export async function createSiemRule(userId: string, input: SiemRuleInput) {
  return prisma.siemRule.create({
    data: {
      userId,
      name: sanitizeText(input.name),
      condition: sanitizeText(input.condition),
      severity: normalizeSeverity(input.severity),
      enabled: input.enabled ?? true,
    },
  });
}

export async function updateSiemRule(userId: string, id: string, input: Partial<SiemRuleInput>) {
  const current = await getSiemRuleById(userId, id);
  if (!current) {
    return null;
  }

  return prisma.siemRule.update({
    where: { id },
    data: {
      ...(input.name ? { name: sanitizeText(input.name) } : {}),
      ...(input.condition ? { condition: sanitizeText(input.condition) } : {}),
      ...(input.severity !== undefined ? { severity: normalizeSeverity(input.severity) } : {}),
      ...(input.enabled !== undefined ? { enabled: input.enabled } : {}),
    },
  });
}

export async function deleteSiemRule(userId: string, id: string) {
  const current = await getSiemRuleById(userId, id);
  if (!current) {
    return null;
  }

  return prisma.siemRule.delete({ where: { id } });
}

export async function listSiemAlerts(userId: string, filters: SiemAlertFilters = {}) {
  const pagination = normalizePagination(filters);
  const where = buildAlertWhere(userId, filters);

  const [entries, total] = await Promise.all([
    prisma.siemAlert.findMany({
      where,
      include: {
        event: { select: { id: true, source: true, category: true, timestamp: true } },
        rule: { select: { id: true, name: true } },
      },
      orderBy: { [filters.sortBy ?? "updatedAt"]: toDirection(filters.sortOrder) },
      skip: pagination.skip,
      take: pagination.pageSize,
    }),
    prisma.siemAlert.count({ where }),
  ]);

  return { entries, total, page: pagination.page, pageSize: pagination.pageSize, totalPages: Math.max(1, Math.ceil(total / pagination.pageSize)) };
}

export async function getSiemAlertById(userId: string, id: string) {
  return prisma.siemAlert.findFirst({
    where: { id, userId },
    include: {
      event: { select: { id: true, source: true, category: true, timestamp: true } },
      rule: { select: { id: true, name: true } },
    },
  });
}

export async function createSiemAlert(userId: string, input: SiemAlertInput) {
  return prisma.siemAlert.create({
    data: {
      userId,
      eventId: input.eventId,
      ruleId: input.ruleId ?? null,
      title: sanitizeText(input.title),
      severity: normalizeSeverity(input.severity),
      status: input.status ?? SiemAlertStatus.OPEN,
    },
  });
}

export async function updateSiemAlert(userId: string, id: string, input: Partial<SiemAlertInput>) {
  const current = await getSiemAlertById(userId, id);
  if (!current) {
    return null;
  }

  return prisma.siemAlert.update({
    where: { id },
    data: {
      ...(input.title ? { title: sanitizeText(input.title) } : {}),
      ...(input.severity !== undefined ? { severity: normalizeSeverity(input.severity) } : {}),
      ...(input.status ? { status: input.status } : {}),
      ...(input.ruleId !== undefined ? { ruleId: input.ruleId || null } : {}),
      ...(input.eventId ? { eventId: input.eventId } : {}),
    },
  });
}

export async function deleteSiemAlert(userId: string, id: string) {
  const current = await getSiemAlertById(userId, id);
  if (!current) {
    return null;
  }

  return prisma.siemAlert.delete({ where: { id } });
}

export async function classifyEvent(userId: string, eventId: string) {
  const event = await prisma.siemEvent.findFirst({
    where: { id: eventId, userId },
    include: { alerts: true },
  });

  if (!event) {
    return null;
  }

  const enabledRules = await prisma.siemRule.findMany({
    where: {
      userId,
      enabled: true,
      severity: { lte: event.severity },
    },
    select: { id: true, name: true, severity: true },
  });

  const categoryDefault = academicCategoryDefaults(event.category);
  const derivedSeverity = Math.max(event.severity, categoryDefault.severity);
  const matchedRule = enabledRules[0];
  const alertTitle = matchedRule
    ? `${matchedRule.name} - ${event.source}`
    : `${event.category} activity review: ${event.source}`;

  const alert = await prisma.siemAlert.create({
    data: {
      userId,
      eventId: event.id,
      ruleId: matchedRule?.id ?? null,
      title: alertTitle,
      severity: derivedSeverity,
      status: event.severity >= 8 ? SiemAlertStatus.OPEN : SiemAlertStatus.ACKNOWLEDGED,
    },
  });

  return { event, alert };
}

export async function getSiemDashboard(userId: string) {
  const [events, openAlerts, closedAlerts, alertsTimeline, severityBuckets, rules, eventCount, alertCount] = await Promise.all([
    prisma.siemEvent.findMany({
      where: { userId },
      select: { id: true, source: true, category: true, severity: true, timestamp: true, description: true },
      orderBy: { timestamp: "desc" },
      take: 12,
    }),
    prisma.siemAlert.count({ where: { userId, status: SiemAlertStatus.OPEN } }),
    prisma.siemAlert.count({ where: { userId, status: SiemAlertStatus.CLOSED } }),
    prisma.siemAlert.findMany({
      where: { userId },
      select: { id: true, title: true, severity: true, status: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
    prisma.siemEvent.groupBy({
      by: ["severity"],
      where: { userId },
      _count: { _all: true },
      orderBy: { severity: "asc" },
    }),
    prisma.siemRule.count({ where: { userId, enabled: true } }),
    prisma.siemEvent.count({ where: { userId } }),
    prisma.siemAlert.count({ where: { userId } }),
  ]);

  return {
    events,
    openAlerts,
    closedAlerts,
    rules,
    eventCount,
    alertCount,
    trends: severityBuckets.map((bucket) => ({ severity: bucket.severity, count: bucket._count._all })),
    timeline: alertsTimeline.map((item) => ({
      ...item,
      createdAt: item.createdAt.toISOString(),
    })),
  };
}
