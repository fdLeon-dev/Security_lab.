import { NextRequest, NextResponse } from "next/server";
import { SiemAlertStatus } from "@prisma/client";
import { z } from "zod";
import { getDefaultUserId } from "@/server/core/default-user";
import { createSiemAlert, listSiemAlerts } from "@/server/modules/siem/siem.service";

const listSchema = z.object({
  search: z.string().optional(),
  status: z.nativeEnum(SiemAlertStatus).optional(),
  severity: z.coerce.number().int().min(1).max(10).optional(),
  sortBy: z.enum(["createdAt", "updatedAt", "severity", "title"]).optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(5).max(50).optional(),
});

const inputSchema = z.object({
  title: z.string().min(3).max(160),
  severity: z.number().int().min(1).max(10),
  status: z.nativeEnum(SiemAlertStatus).optional(),
  eventId: z.string().min(5),
  ruleId: z.string().nullable().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const userId = await getDefaultUserId();
    const filters = listSchema.parse({
      search: request.nextUrl.searchParams.get("search") ?? undefined,
      status: request.nextUrl.searchParams.get("status") ?? undefined,
      severity: request.nextUrl.searchParams.get("severity") ?? undefined,
      sortBy: request.nextUrl.searchParams.get("sortBy") ?? undefined,
      sortOrder: request.nextUrl.searchParams.get("sortOrder") ?? undefined,
      page: request.nextUrl.searchParams.get("page") ?? undefined,
      pageSize: request.nextUrl.searchParams.get("pageSize") ?? undefined,
    });

    const data = await listSiemAlerts(userId, filters);
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ entries: [], total: 0, page: 1, pageSize: 10, totalPages: 1 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getDefaultUserId();
    const payload = inputSchema.parse(await request.json());
    const alert = await createSiemAlert(userId, {
      ...payload,
      ruleId: payload.ruleId ?? null,
    });

    return NextResponse.json(alert, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid SIEM alert payload" }, { status: 400 });
  }
}
