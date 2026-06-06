import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getDefaultUserId } from "@/server/core/default-user";

const siemEventSchema = z.object({
  source: z.string().min(2),
  eventType: z.string().min(2),
  severity: z.number().int().min(1).max(10),
  details: z.string().min(5),
});

export async function GET() {
  try {
    const userId = await getDefaultUserId();
    const events = await prisma.siemEvent.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 30,
    });
    return NextResponse.json(events);
  } catch {
    return NextResponse.json([]);
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getDefaultUserId();
    const payload = siemEventSchema.parse(await request.json());
    const event = await prisma.siemEvent.create({
      data: {
        userId,
        source: payload.source,
        eventType: payload.eventType,
        severity: payload.severity,
        details: payload.details,
      },
    });
    return NextResponse.json(event, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid SIEM event payload" }, { status: 400 });
  }
}
