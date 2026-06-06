import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getDefaultUserId } from "@/server/core/default-user";
import {
  deleteVirtualMachine,
  getVirtualMachineById,
  updateVirtualMachine,
} from "@/server/modules/inventory/inventory.service";

const updateSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  os: z.string().min(2).max(120).optional(),
  resources: z.string().min(2).max(255).optional(),
  hypervisor: z.string().min(2).max(80).optional(),
  assetId: z.string().nullable().optional(),
  networkId: z.string().nullable().optional(),
});

export async function GET(_: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getDefaultUserId();
    const { id } = await context.params;
    const item = await getVirtualMachineById(userId, id);

    if (!item) {
      return NextResponse.json({ error: "Virtual machine not found" }, { status: 404 });
    }

    return NextResponse.json(item);
  } catch {
    return NextResponse.json({ error: "Unable to fetch virtual machine" }, { status: 400 });
  }
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getDefaultUserId();
    const { id } = await context.params;
    const payload = updateSchema.parse(await request.json());
    const updated = await updateVirtualMachine(userId, id, payload);

    if (!updated) {
      return NextResponse.json({ error: "Virtual machine not found" }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Invalid virtual machine payload" }, { status: 400 });
  }
}

export async function DELETE(_: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getDefaultUserId();
    const { id } = await context.params;
    const deleted = await deleteVirtualMachine(userId, id);

    if (!deleted) {
      return NextResponse.json({ error: "Virtual machine not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Unable to delete virtual machine" }, { status: 400 });
  }
}
