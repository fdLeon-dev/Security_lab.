import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getDefaultUserId } from "@/server/core/default-user";
import {
  deleteSiemRule,
  getSiemRuleById,
  updateSiemRule,
} from "@/server/modules/siem/siem.service";

const updateSchema = z.object({
  name: z.string().min(2).max(160).optional(),
  condition: z.string().min(5).max(500).optional(),
  severity: z.number().int().min(1).max(10).optional(),
  enabled: z.boolean().optional(),
});

export async function GET(_: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getDefaultUserId();
    const { id } = await context.params;
    const rule = await getSiemRuleById(userId, id);

    if (!rule) {
      return NextResponse.json({ error: "Rule not found" }, { status: 404 });
    }

    return NextResponse.json(rule);
  } catch {
    return NextResponse.json({ error: "Unable to fetch rule" }, { status: 400 });
  }
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getDefaultUserId();
    const { id } = await context.params;
    const payload = updateSchema.parse(await request.json());
    const rule = await updateSiemRule(userId, id, payload);

    if (!rule) {
      return NextResponse.json({ error: "Rule not found" }, { status: 404 });
    }

    return NextResponse.json(rule);
  } catch {
    return NextResponse.json({ error: "Invalid rule payload" }, { status: 400 });
  }
}

export async function DELETE(_: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getDefaultUserId();
    const { id } = await context.params;
    const deleted = await deleteSiemRule(userId, id);

    if (!deleted) {
      return NextResponse.json({ error: "Rule not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Unable to delete rule" }, { status: 400 });
  }
}
