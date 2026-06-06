import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getDefaultUserId } from "@/server/core/default-user";
import { createAsset, listAssets } from "@/server/modules/inventory/inventory.service";

const listSchema = z.object({
  search: z.string().optional(),
  type: z.string().optional(),
  networkId: z.string().optional(),
  sortBy: z.enum(["createdAt", "updatedAt", "name", "type"]).optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(5).max(50).optional(),
});

const inputSchema = z.object({
  name: z.string().min(2).max(120),
  type: z.string().min(2).max(80),
  manufacturer: z.string().max(120).nullable().optional(),
  operatingSystem: z.string().max(120).nullable().optional(),
  ipAddress: z.string().max(64).nullable().optional(),
  notes: z.string().max(5000).nullable().optional(),
  networkId: z.string().nullable().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const userId = await getDefaultUserId();
    const filters = listSchema.parse({
      search: request.nextUrl.searchParams.get("search") ?? undefined,
      type: request.nextUrl.searchParams.get("type") ?? undefined,
      networkId: request.nextUrl.searchParams.get("networkId") ?? undefined,
      sortBy: request.nextUrl.searchParams.get("sortBy") ?? undefined,
      sortOrder: request.nextUrl.searchParams.get("sortOrder") ?? undefined,
      page: request.nextUrl.searchParams.get("page") ?? undefined,
      pageSize: request.nextUrl.searchParams.get("pageSize") ?? undefined,
    });

    const result = await listAssets(userId, filters);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ entries: [], total: 0, page: 1, pageSize: 10, totalPages: 1 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getDefaultUserId();
    const payload = inputSchema.parse(await request.json());
    const created = await createAsset(userId, {
      ...payload,
      manufacturer: payload.manufacturer ?? null,
      operatingSystem: payload.operatingSystem ?? null,
      ipAddress: payload.ipAddress ?? null,
      notes: payload.notes ?? null,
      networkId: payload.networkId ?? null,
    });

    return NextResponse.json(created, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid asset payload" }, { status: 400 });
  }
}
