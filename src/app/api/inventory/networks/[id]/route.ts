import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getDefaultUserId } from "@/server/core/default-user";
import {
  deleteNetwork,
  getNetworkById,
  updateNetwork,
} from "@/server/modules/inventory/inventory.service";

const updateSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  subnet: z.string().min(4).max(64).optional(),
  gateway: z.string().max(64).nullable().optional(),
  notes: z.string().max(5000).nullable().optional(),
});

export async function GET(_: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getDefaultUserId();
    const { id } = await context.params;
    const item = await getNetworkById(userId, id);

    if (!item) {
      return NextResponse.json({ error: "Network not found" }, { status: 404 });
    }

    return NextResponse.json(item);
  } catch {
    return NextResponse.json({ error: "Unable to fetch network" }, { status: 400 });
  }
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getDefaultUserId();
    const { id } = await context.params;
    const payload = updateSchema.parse(await request.json());
    const updated = await updateNetwork(userId, id, payload);

    if (!updated) {
      return NextResponse.json({ error: "Network not found" }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Invalid network payload" }, { status: 400 });
  }
}

export async function DELETE(_: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getDefaultUserId();
    const { id } = await context.params;
    const deleted = await deleteNetwork(userId, id);

    if (!deleted) {
      return NextResponse.json({ error: "Network not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Unable to delete network" }, { status: 400 });
  }
}
