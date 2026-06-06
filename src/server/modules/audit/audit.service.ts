import { prisma } from "@/lib/prisma";

export async function writeAuditLog(input: {
  userId?: string | null;
  action: string;
  resource: string;
  resourceId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}) {
  return prisma.auditLog.create({
    data: {
      userId: input.userId ?? null,
      action: input.action,
      resource: input.resource,
      resourceId: input.resourceId ?? null,
      ipAddress: input.ipAddress?.slice(0, 80) ?? null,
      userAgent: input.userAgent?.slice(0, 255) ?? null,
    },
  });
}

export async function listRecentAuditLogs(limit = 50) {
  return prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: Math.min(Math.max(limit, 1), 100),
    select: {
      id: true,
      userId: true,
      action: true,
      resource: true,
      resourceId: true,
      ipAddress: true,
      userAgent: true,
      createdAt: true,
    },
  });
}
