import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getDefaultUserId } from "@/server/core/default-user";
import {
  deleteService,
  getServiceById,
  updateService,
} from "@/server/modules/inventory/inventory.service";

const updateSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  protocol: z.string().min(2).max(16).optional(),
  port: z.number().int().min(1).max(65535).optional(),
  assetId: z.string().min(5).optional(),
});

export async function GET(_: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getDefaultUserId();
    const { id } = await context.params;
    const item = await getServiceById(userId, id);

    if (!item) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    return NextResponse.json(item);
  } catch {
    return NextResponse.json({ error: "Unable to fetch service" }, { status: 400 });
  }
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getDefaultUserId();
    const { id } = await context.params;
    const payload = updateSchema.parse(await request.json());
    const updated = await updateService(userId, id, payload);

    if (!updated) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Invalid service payload" }, { status: 400 });
  }
}

export async function DELETE(_: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getDefaultUserId();
    const { id } = await context.params;
    const deleted = await deleteService(userId, id);

    if (!deleted) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Unable to delete service" }, { status: 400 });
  }
}
