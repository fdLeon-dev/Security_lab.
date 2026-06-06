import { Difficulty, LabCategory, LabPlatform, RecordStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  deleteLab,
  getLabById,
  updateLab,
} from "@/server/modules/labs/labs.service";
import { getDefaultUserId } from "@/server/core/default-user";

const labUpdateSchema = z.object({
  title: z.string().min(3).max(120).optional(),
  platform: z.nativeEnum(LabPlatform).optional(),
  category: z.nativeEnum(LabCategory).optional(),
  difficulty: z.nativeEnum(Difficulty).optional(),
  status: z.nativeEnum(RecordStatus).optional(),
  notes: z.string().max(5000).nullable().optional(),
  completedAt: z.string().datetime().nullable().optional(),
});

export async function GET(_: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getDefaultUserId();
    const { id } = await context.params;
    const lab = await getLabById(userId, id);

    if (!lab) {
      return NextResponse.json({ error: "Lab not found" }, { status: 404 });
    }

    return NextResponse.json(lab);
  } catch {
    return NextResponse.json({ error: "Unable to fetch lab" }, { status: 400 });
  }
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getDefaultUserId();
    const { id } = await context.params;
    const payload = labUpdateSchema.parse(await request.json());
    const lab = await updateLab(userId, id, {
      ...payload,
      completedAt:
        payload.completedAt === undefined
          ? undefined
          : payload.completedAt
            ? new Date(payload.completedAt)
            : null,
    });

    if (!lab) {
      return NextResponse.json({ error: "Lab not found" }, { status: 404 });
    }

    return NextResponse.json(lab);
  } catch {
    return NextResponse.json({ error: "Invalid lab payload" }, { status: 400 });
  }
}

export async function DELETE(_: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getDefaultUserId();
    const { id } = await context.params;
    const deleted = await deleteLab(userId, id);

    if (!deleted) {
      return NextResponse.json({ error: "Lab not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Unable to delete lab" }, { status: 400 });
  }
}
