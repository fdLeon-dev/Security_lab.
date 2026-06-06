import { WriteupCategory, WriteupVisibility } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  createWriteup,
  listWriteups,
} from "@/server/modules/writeups/writeups.service";
import { getDefaultUserId } from "@/server/core/default-user";

const writeupFiltersSchema = z.object({
  search: z.string().optional(),
  category: z.nativeEnum(WriteupCategory).optional(),
  visibility: z.nativeEnum(WriteupVisibility).optional(),
  sortBy: z.enum(["createdAt", "updatedAt", "title"]).optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
});

const writeupInputSchema = z.object({
  title: z.string().min(3).max(160),
  slug: z.string().min(3).max(100).optional(),
  content: z.string().min(10),
  tags: z.array(z.string()).default([]),
  category: z.nativeEnum(WriteupCategory),
  visibility: z.nativeEnum(WriteupVisibility),
});

export async function GET(request: NextRequest) {
  try {
    const userId = await getDefaultUserId();
    const filters = writeupFiltersSchema.parse({
      search: request.nextUrl.searchParams.get("search") ?? undefined,
      category: request.nextUrl.searchParams.get("category") ?? undefined,
      visibility: request.nextUrl.searchParams.get("visibility") ?? undefined,
      sortBy: request.nextUrl.searchParams.get("sortBy") ?? undefined,
      sortOrder: request.nextUrl.searchParams.get("sortOrder") ?? undefined,
    });
    const writeups = await listWriteups(userId, filters);
    return NextResponse.json(writeups);
  } catch {
    return NextResponse.json([]);
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getDefaultUserId();
    const payload = writeupInputSchema.parse(await request.json());
    const writeup = await createWriteup(userId, payload);
    return NextResponse.json(writeup, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid writeup payload" }, { status: 400 });
  }
}
