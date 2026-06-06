import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getDefaultUserId } from "@/server/core/default-user";
import {
  createVirtualMachine,
  listVirtualMachines,
} from "@/server/modules/inventory/inventory.service";

const listSchema = z.object({
  search: z.string().optional(),
  hypervisor: z.string().optional(),
  assetId: z.string().optional(),
  networkId: z.string().optional(),
  sortBy: z.enum(["createdAt", "updatedAt", "name", "hypervisor"]).optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(5).max(50).optional(),
});

const inputSchema = z.object({
  name: z.string().min(2).max(120),
  os: z.string().min(2).max(120),
  resources: z.string().min(2).max(255),
  hypervisor: z.string().min(2).max(80),
  assetId: z.string().nullable().optional(),
  networkId: z.string().nullable().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const userId = await getDefaultUserId();
    const filters = listSchema.parse({
      search: request.nextUrl.searchParams.get("search") ?? undefined,
      hypervisor: request.nextUrl.searchParams.get("hypervisor") ?? undefined,
      assetId: request.nextUrl.searchParams.get("assetId") ?? undefined,
      networkId: request.nextUrl.searchParams.get("networkId") ?? undefined,
      sortBy: request.nextUrl.searchParams.get("sortBy") ?? undefined,
      sortOrder: request.nextUrl.searchParams.get("sortOrder") ?? undefined,
      page: request.nextUrl.searchParams.get("page") ?? undefined,
      pageSize: request.nextUrl.searchParams.get("pageSize") ?? undefined,
    });

    const result = await listVirtualMachines(userId, filters);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ entries: [], total: 0, page: 1, pageSize: 10, totalPages: 1 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getDefaultUserId();
    const payload = inputSchema.parse(await request.json());
    const created = await createVirtualMachine(userId, {
      ...payload,
      assetId: payload.assetId ?? null,
      networkId: payload.networkId ?? null,
    });

    return NextResponse.json(created, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid virtual machine payload" }, { status: 400 });
  }
}
