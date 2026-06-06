import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getDefaultUserId } from "@/server/core/default-user";
import {
  deleteAsset,
  getAssetById,
  updateAsset,
} from "@/server/modules/inventory/inventory.service";

const updateSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  type: z.string().min(2).max(80).optional(),
  manufacturer: z.string().max(120).nullable().optional(),
  operatingSystem: z.string().max(120).nullable().optional(),
  ipAddress: z.string().max(64).nullable().optional(),
  notes: z.string().max(5000).nullable().optional(),
  networkId: z.string().nullable().optional(),
});

export async function GET(_: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getDefaultUserId();
    const { id } = await context.params;
    const item = await getAssetById(userId, id);

    if (!item) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    }

    return NextResponse.json(item);
  } catch {
    return NextResponse.json({ error: "Unable to fetch asset" }, { status: 400 });
  }
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getDefaultUserId();
    const { id } = await context.params;
    const payload = updateSchema.parse(await request.json());
    const updated = await updateAsset(userId, id, payload);

    if (!updated) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Invalid asset payload" }, { status: 400 });
  }
}

export async function DELETE(_: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getDefaultUserId();
    const { id } = await context.params;
    const deleted = await deleteAsset(userId, id);

    if (!deleted) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Unable to delete asset" }, { status: 400 });
  }
}
