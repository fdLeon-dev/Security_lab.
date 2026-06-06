import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createKnowledgeNote, listKnowledgeNotes } from "@/server/modules/knowledge/knowledge.service";
import { getDefaultUserId } from "@/server/core/default-user";

const noteSchema = z.object({
  title: z.string().min(3).max(120),
  category: z.string().min(2).max(50),
  tags: z.array(z.string()).optional(),
  links: z.array(z.string()).optional(),
  contentMd: z.string().min(10),
});

export async function GET() {
  try {
    const userId = await getDefaultUserId();
    const notes = await listKnowledgeNotes(userId);
    return NextResponse.json(notes);
  } catch {
    return NextResponse.json([]);
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getDefaultUserId();
    const payload = noteSchema.parse(await request.json());
    const note = await createKnowledgeNote(userId, payload);
    return NextResponse.json(note, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid note payload" }, { status: 400 });
  }
}
