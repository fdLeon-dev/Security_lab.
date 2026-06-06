import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getDefaultUserId } from "@/server/core/default-user";
import { createNetwork, listNetworks } from "@/server/modules/inventory/inventory.service";

const listSchema = z.object({
  search: z.string().optional(),
  sortBy: z.enum(["createdAt", "updatedAt", "name"]).optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(5).max(50).optional(),
});

const inputSchema = z.object({
  name: z.string().min(2).max(120),
  subnet: z.string().min(4).max(64),
  gateway: z.string().max(64).nullable().optional(),
  notes: z.string().max(5000).nullable().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const userId = await getDefaultUserId();
    const filters = listSchema.parse({
      search: request.nextUrl.searchParams.get("search") ?? undefined,
      sortBy: request.nextUrl.searchParams.get("sortBy") ?? undefined,
      sortOrder: request.nextUrl.searchParams.get("sortOrder") ?? undefined,
      page: request.nextUrl.searchParams.get("page") ?? undefined,
      pageSize: request.nextUrl.searchParams.get("pageSize") ?? undefined,
    });

    const result = await listNetworks(userId, filters);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ entries: [], total: 0, page: 1, pageSize: 10, totalPages: 1 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getDefaultUserId();
    const payload = inputSchema.parse(await request.json());
    const created = await createNetwork(userId, {
      ...payload,
      gateway: payload.gateway ?? null,
      notes: payload.notes ?? null,
    });

    return NextResponse.json(created, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid network payload" }, { status: 400 });
  }
}
