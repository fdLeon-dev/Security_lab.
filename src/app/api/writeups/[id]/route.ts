import { WriteupCategory, WriteupVisibility } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  deleteWriteup,
  getWriteupById,
  updateWriteup,
} from "@/server/modules/writeups/writeups.service";
import { getDefaultUserId } from "@/server/core/default-user";

const writeupUpdateSchema = z.object({
  title: z.string().min(3).max(160).optional(),
  slug: z.string().min(3).max(100).optional(),
  content: z.string().min(10).optional(),
  tags: z.array(z.string()).optional(),
  category: z.nativeEnum(WriteupCategory).optional(),
  visibility: z.nativeEnum(WriteupVisibility).optional(),
});

export async function GET(_: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getDefaultUserId();
    const { id } = await context.params;
    const writeup = await getWriteupById(userId, id);

    if (!writeup) {
      return NextResponse.json({ error: "Writeup not found" }, { status: 404 });
    }

    return NextResponse.json(writeup);
  } catch {
    return NextResponse.json({ error: "Unable to fetch writeup" }, { status: 400 });
  }
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getDefaultUserId();
    const { id } = await context.params;
    const payload = writeupUpdateSchema.parse(await request.json());
    const writeup = await updateWriteup(userId, id, payload);

    if (!writeup) {
      return NextResponse.json({ error: "Writeup not found" }, { status: 404 });
    }

    return NextResponse.json(writeup);
  } catch {
    return NextResponse.json({ error: "Invalid writeup payload" }, { status: 400 });
  }
}

export async function DELETE(_: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getDefaultUserId();
    const { id } = await context.params;
    const deleted = await deleteWriteup(userId, id);

    if (!deleted) {
      return NextResponse.json({ error: "Writeup not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Unable to delete writeup" }, { status: 400 });
  }
}
