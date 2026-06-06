import { Difficulty, LabCategory, LabPlatform, RecordStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  createLab,
  getLabStats,
  listLabEntries,
} from "@/server/modules/labs/labs.service";
import { getDefaultUserId } from "@/server/core/default-user";

const labFiltersSchema = z.object({
  search: z.string().optional(),
  platform: z.nativeEnum(LabPlatform).optional(),
  category: z.nativeEnum(LabCategory).optional(),
  difficulty: z.nativeEnum(Difficulty).optional(),
  status: z.nativeEnum(RecordStatus).optional(),
  sortBy: z.enum(["createdAt", "updatedAt", "completedAt", "title", "difficulty"]).optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
});

const labInputSchema = z.object({
  title: z.string().min(3).max(120),
  platform: z.nativeEnum(LabPlatform),
  category: z.nativeEnum(LabCategory),
  difficulty: z.nativeEnum(Difficulty),
  status: z.nativeEnum(RecordStatus),
  notes: z.string().max(5000).nullable().optional(),
  completedAt: z.string().datetime().nullable().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const userId = await getDefaultUserId();
    const filters = labFiltersSchema.parse({
      search: request.nextUrl.searchParams.get("search") ?? undefined,
      platform: request.nextUrl.searchParams.get("platform") ?? undefined,
      category: request.nextUrl.searchParams.get("category") ?? undefined,
      difficulty: request.nextUrl.searchParams.get("difficulty") ?? undefined,
      status: request.nextUrl.searchParams.get("status") ?? undefined,
      sortBy: request.nextUrl.searchParams.get("sortBy") ?? undefined,
      sortOrder: request.nextUrl.searchParams.get("sortOrder") ?? undefined,
    });
    const [entries, stats] = await Promise.all([
      listLabEntries(userId, filters),
      getLabStats(userId, filters),
    ]);
    return NextResponse.json({ entries, stats });
  } catch {
    return NextResponse.json({
      entries: [],
      stats: { completed: 0, pending: 0, total: 0, byCategory: [], byDifficulty: [] },
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getDefaultUserId();
    const payload = labInputSchema.parse(await request.json());
    const lab = await createLab(userId, {
      ...payload,
      completedAt: payload.completedAt ? new Date(payload.completedAt) : null,
      notes: payload.notes ?? null,
    });

    return NextResponse.json(lab, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid lab payload" }, { status: 400 });
  }
}
