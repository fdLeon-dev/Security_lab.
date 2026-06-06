import { RecordStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  createCertification,
  getCertificationDashboard,
  listCertifications,
} from "@/server/modules/certifications/certifications.service";
import { getDefaultUserId } from "@/server/core/default-user";

const certificationFiltersSchema = z.object({
  search: z.string().optional(),
  status: z.nativeEnum(RecordStatus).optional(),
  provider: z.string().optional(),
  sortBy: z.enum(["updatedAt", "createdAt", "targetDate", "progress", "name"]).optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
});

const certificationInputSchema = z.object({
  name: z.string().min(2).max(160),
  provider: z.string().min(2).max(120),
  status: z.nativeEnum(RecordStatus),
  startDate: z.string().datetime().nullable().optional(),
  targetDate: z.string().datetime().nullable().optional(),
  completionDate: z.string().datetime().nullable().optional(),
  progress: z.number().int().min(0).max(100),
  notes: z.string().max(5000).nullable().optional(),
  evidenceUrl: z.string().url().nullable().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const userId = await getDefaultUserId();
    const filters = certificationFiltersSchema.parse({
      search: request.nextUrl.searchParams.get("search") ?? undefined,
      status: request.nextUrl.searchParams.get("status") ?? undefined,
      provider: request.nextUrl.searchParams.get("provider") ?? undefined,
      sortBy: request.nextUrl.searchParams.get("sortBy") ?? undefined,
      sortOrder: request.nextUrl.searchParams.get("sortOrder") ?? undefined,
    });

    const [entries, dashboard] = await Promise.all([
      listCertifications(userId, filters),
      getCertificationDashboard(userId, filters),
    ]);

    return NextResponse.json({ entries, dashboard });
  } catch {
    return NextResponse.json({
      entries: [],
      dashboard: { total: 0, completed: 0, inProgress: 0, averageProgress: 0, upcoming: [] },
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getDefaultUserId();
    const payload = certificationInputSchema.parse(await request.json());
    const certification = await createCertification(userId, {
      ...payload,
      startDate: payload.startDate ? new Date(payload.startDate) : null,
      targetDate: payload.targetDate ? new Date(payload.targetDate) : null,
      completionDate: payload.completionDate ? new Date(payload.completionDate) : null,
      notes: payload.notes ?? null,
      evidenceUrl: payload.evidenceUrl ?? null,
    });

    return NextResponse.json(certification, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid certification payload" }, { status: 400 });
  }
}
