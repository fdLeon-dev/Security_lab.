import { NextRequest, NextResponse } from "next/server";
import { SiemEventCategory } from "@prisma/client";
import { z } from "zod";
import { getDefaultUserId } from "@/server/core/default-user";
import {
  deleteSiemEvent,
  getSiemEventById,
  updateSiemEvent,
} from "@/server/modules/siem/siem.service";

const updateSchema = z.object({
  source: z.string().min(2).max(120).optional(),
  category: z.nativeEnum(SiemEventCategory).optional(),
  severity: z.number().int().min(1).max(10).optional(),
  timestamp: z.string().datetime().optional(),
  description: z.string().min(5).max(5000).optional(),
});

export async function GET(_: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getDefaultUserId();
    const { id } = await context.params;
    const event = await getSiemEventById(userId, id);

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    return NextResponse.json(event);
  } catch {
    return NextResponse.json({ error: "Unable to fetch event" }, { status: 400 });
  }
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getDefaultUserId();
    const { id } = await context.params;
    const payload = updateSchema.parse(await request.json());
    const event = await updateSiemEvent(userId, id, {
      ...payload,
      timestamp: payload.timestamp ? new Date(payload.timestamp) : undefined,
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    return NextResponse.json(event);
  } catch {
    return NextResponse.json({ error: "Invalid event payload" }, { status: 400 });
  }
}

export async function DELETE(_: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getDefaultUserId();
    const { id } = await context.params;
    const deleted = await deleteSiemEvent(userId, id);

    if (!deleted) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Unable to delete event" }, { status: 400 });
  }
}
