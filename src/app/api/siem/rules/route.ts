import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getDefaultUserId } from "@/server/core/default-user";
import { createSiemRule, listSiemRules } from "@/server/modules/siem/siem.service";

const listSchema = z.object({
  search: z.string().optional(),
  severity: z.coerce.number().int().min(1).max(10).optional(),
  enabled: z.enum(["true", "false"]).optional(),
  sortBy: z.enum(["createdAt", "updatedAt", "severity", "name"]).optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(5).max(50).optional(),
});

const inputSchema = z.object({
  name: z.string().min(2).max(160),
  condition: z.string().min(5).max(500),
  severity: z.number().int().min(1).max(10),
  enabled: z.boolean().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const userId = await getDefaultUserId();
    const parsed = listSchema.parse({
      search: request.nextUrl.searchParams.get("search") ?? undefined,
      severity: request.nextUrl.searchParams.get("severity") ?? undefined,
      enabled: request.nextUrl.searchParams.get("enabled") ?? undefined,
      sortBy: request.nextUrl.searchParams.get("sortBy") ?? undefined,
      sortOrder: request.nextUrl.searchParams.get("sortOrder") ?? undefined,
      page: request.nextUrl.searchParams.get("page") ?? undefined,
      pageSize: request.nextUrl.searchParams.get("pageSize") ?? undefined,
    });

    const filters = {
      ...parsed,
      enabled: parsed.enabled === undefined ? undefined : parsed.enabled === "true",
    };

    const data = await listSiemRules(userId, filters);
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ entries: [], total: 0, page: 1, pageSize: 10, totalPages: 1 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getDefaultUserId();
    const payload = inputSchema.parse(await request.json());
    const rule = await createSiemRule(userId, payload);
    return NextResponse.json(rule, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid SIEM rule payload" }, { status: 400 });
  }
}
