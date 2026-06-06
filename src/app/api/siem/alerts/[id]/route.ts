import { NextRequest, NextResponse } from "next/server";
import { SiemAlertStatus } from "@prisma/client";
import { z } from "zod";
import { getDefaultUserId } from "@/server/core/default-user";
import {
  deleteSiemAlert,
  getSiemAlertById,
  updateSiemAlert,
} from "@/server/modules/siem/siem.service";

const updateSchema = z.object({
  title: z.string().min(3).max(160).optional(),
  severity: z.number().int().min(1).max(10).optional(),
  status: z.nativeEnum(SiemAlertStatus).optional(),
  eventId: z.string().min(5).optional(),
  ruleId: z.string().nullable().optional(),
});

export async function GET(_: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getDefaultUserId();
    const { id } = await context.params;
    const alert = await getSiemAlertById(userId, id);

    if (!alert) {
      return NextResponse.json({ error: "Alert not found" }, { status: 404 });
    }

    return NextResponse.json(alert);
  } catch {
    return NextResponse.json({ error: "Unable to fetch alert" }, { status: 400 });
  }
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getDefaultUserId();
    const { id } = await context.params;
    const payload = updateSchema.parse(await request.json());
    const alert = await updateSiemAlert(userId, id, {
      ...payload,
      ruleId: payload.ruleId,
    });

    if (!alert) {
      return NextResponse.json({ error: "Alert not found" }, { status: 404 });
    }

    return NextResponse.json(alert);
  } catch {
    return NextResponse.json({ error: "Invalid alert payload" }, { status: 400 });
  }
}

export async function DELETE(_: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getDefaultUserId();
    const { id } = await context.params;
    const deleted = await deleteSiemAlert(userId, id);

    if (!deleted) {
      return NextResponse.json({ error: "Alert not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Unable to delete alert" }, { status: 400 });
  }
}
