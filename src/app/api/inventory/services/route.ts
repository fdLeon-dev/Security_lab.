import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getDefaultUserId } from "@/server/core/default-user";
import { createService, listServices } from "@/server/modules/inventory/inventory.service";

const listSchema = z.object({
  search: z.string().optional(),
  protocol: z.string().optional(),
  assetId: z.string().optional(),
  sortBy: z.enum(["createdAt", "updatedAt", "name", "port"]).optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(5).max(50).optional(),
});

const inputSchema = z.object({
  name: z.string().min(2).max(120),
  protocol: z.string().min(2).max(16),
  port: z.number().int().min(1).max(65535),
  assetId: z.string().min(5),
});

export async function GET(request: NextRequest) {
  try {
    const userId = await getDefaultUserId();
    const filters = listSchema.parse({
      search: request.nextUrl.searchParams.get("search") ?? undefined,
      protocol: request.nextUrl.searchParams.get("protocol") ?? undefined,
      assetId: request.nextUrl.searchParams.get("assetId") ?? undefined,
      sortBy: request.nextUrl.searchParams.get("sortBy") ?? undefined,
      sortOrder: request.nextUrl.searchParams.get("sortOrder") ?? undefined,
      page: request.nextUrl.searchParams.get("page") ?? undefined,
      pageSize: request.nextUrl.searchParams.get("pageSize") ?? undefined,
    });

    const result = await listServices(userId, filters);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ entries: [], total: 0, page: 1, pageSize: 10, totalPages: 1 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getDefaultUserId();
    const payload = inputSchema.parse(await request.json());
    const created = await createService(userId, payload);
    return NextResponse.json(created, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid service payload" }, { status: 400 });
  }
}
