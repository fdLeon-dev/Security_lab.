import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getToolkitHistory } from "@/server/modules/toolkit/toolkit.service";

const VALID_TOOLS = [
  "dns_lookup",
  "ssl_checker",
  "log_analyzer",
  "hash_utilities",
  "json_formatter",
  "base64",
  "password_policy",
] as const;

const schema = z.object({
  tool: z.enum(VALID_TOOLS).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { tool } = schema.parse({
      tool: request.nextUrl.searchParams.get("tool") ?? undefined,
    });
    const history = await getToolkitHistory(tool);
    return NextResponse.json(history);
  } catch {
    return NextResponse.json([]);
  }
}
