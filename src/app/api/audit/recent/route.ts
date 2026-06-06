import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { listRecentAuditLogs } from "@/server/modules/audit/audit.service";

const schema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { limit = 50 } = schema.parse({
      limit: request.nextUrl.searchParams.get("limit") ?? undefined,
    });
    const logs = await listRecentAuditLogs(limit);
    return NextResponse.json(logs);
  } catch {
    return NextResponse.json([]);
  }
}
