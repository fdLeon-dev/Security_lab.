import { RecordStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  deleteCertification,
  getCertificationById,
  updateCertification,
} from "@/server/modules/certifications/certifications.service";
import { getDefaultUserId } from "@/server/core/default-user";

const certificationUpdateSchema = z.object({
  name: z.string().min(2).max(160).optional(),
  provider: z.string().min(2).max(120).optional(),
  status: z.nativeEnum(RecordStatus).optional(),
  startDate: z.string().datetime().nullable().optional(),
  targetDate: z.string().datetime().nullable().optional(),
  completionDate: z.string().datetime().nullable().optional(),
  progress: z.number().int().min(0).max(100).optional(),
  notes: z.string().max(5000).nullable().optional(),
  evidenceUrl: z.string().url().nullable().optional(),
});

export async function GET(_: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getDefaultUserId();
    const { id } = await context.params;
    const certification = await getCertificationById(userId, id);

    if (!certification) {
      return NextResponse.json({ error: "Certification not found" }, { status: 404 });
    }

    return NextResponse.json(certification);
  } catch {
    return NextResponse.json({ error: "Unable to fetch certification" }, { status: 400 });
  }
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getDefaultUserId();
    const { id } = await context.params;
    const payload = certificationUpdateSchema.parse(await request.json());
    const certification = await updateCertification(userId, id, {
      ...payload,
      startDate:
        payload.startDate === undefined ? undefined : payload.startDate ? new Date(payload.startDate) : null,
      targetDate:
        payload.targetDate === undefined ? undefined : payload.targetDate ? new Date(payload.targetDate) : null,
      completionDate:
        payload.completionDate === undefined
          ? undefined
          : payload.completionDate
            ? new Date(payload.completionDate)
            : null,
    });

    if (!certification) {
      return NextResponse.json({ error: "Certification not found" }, { status: 404 });
    }

    return NextResponse.json(certification);
  } catch {
    return NextResponse.json({ error: "Invalid certification payload" }, { status: 400 });
  }
}

export async function DELETE(_: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getDefaultUserId();
    const { id } = await context.params;
    const deleted = await deleteCertification(userId, id);

    if (!deleted) {
      return NextResponse.json({ error: "Certification not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Unable to delete certification" }, { status: 400 });
  }
}
