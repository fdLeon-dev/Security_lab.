import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { saveToolkitReport } from "@/server/modules/toolkit/toolkit.service";

const schema = z.object({
  input: z.string().min(1).max(100_000),
  mode: z.enum(["encode", "decode"]),
});

export async function POST(request: NextRequest) {
  try {
    const { input, mode } = schema.parse(await request.json());

    let output: string;
    if (mode === "encode") {
      output = Buffer.from(input, "utf8").toString("base64");
    } else {
      const decoded = Buffer.from(input, "base64");
      output = decoded.toString("utf8");
    }

    await saveToolkitReport("base64", `[${mode}] ${input.slice(0, 60)}`, output.slice(0, 2000));
    return NextResponse.json({ output, mode });
  } catch {
    return NextResponse.json({ error: "Invalid Base64 request" }, { status: 400 });
  }
}
