import { prisma } from "@/lib/prisma";
import { sanitizeText } from "@/lib/security";

export type ToolName =
  | "dns_lookup"
  | "ssl_checker"
  | "log_analyzer"
  | "hash_utilities"
  | "json_formatter"
  | "base64"
  | "password_policy";

export async function saveToolkitReport(toolName: ToolName, input: string, output: string) {
  return prisma.toolkitReport.create({
    data: {
      toolName,
      input: sanitizeText(input).slice(0, 2000),
      output: output.slice(0, 8000),
    },
  });
}

export async function getToolkitHistory(toolName?: ToolName) {
  return prisma.toolkitReport.findMany({
    where: toolName ? { toolName } : undefined,
    orderBy: { createdAt: "desc" },
    take: 20,
    select: {
      id: true,
      toolName: true,
      input: true,
      output: true,
      createdAt: true,
    },
  });
}

export async function getToolkitDashboard() {
  const [recent, countByTool] = await Promise.all([
    prisma.toolkitReport.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      select: { id: true, toolName: true, input: true, createdAt: true },
    }),
    prisma.toolkitReport.groupBy({
      by: ["toolName"],
      _count: { _all: true },
      orderBy: { _count: { toolName: "desc" } },
    }),
  ]);

  return {
    recent: recent.map((item) => ({
      ...item,
      createdAt: item.createdAt.toISOString(),
    })),
    stats: countByTool.map((item) => ({
      tool: item.toolName,
      count: item._count._all,
    })),
  };
}
