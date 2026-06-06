import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { saveToolkitReport } from "@/server/modules/toolkit/toolkit.service";

const schema = z.object({
  input: z.string().min(1).max(100_000),
  indent: z.number().int().min(1).max(8).default(2),
});

export async function POST(request: NextRequest) {
  try {
    const { input, indent } = schema.parse(await request.json());
    const parsed: unknown = JSON.parse(input);
    const formatted = JSON.stringify(parsed, null, indent);
    await saveToolkitReport("json_formatter", input.slice(0, 200), formatted.slice(0, 2000));
    return NextResponse.json({ formatted });
  } catch {
    return NextResponse.json({ error: "Invalid JSON input" }, { status: 400 });
  }
}
