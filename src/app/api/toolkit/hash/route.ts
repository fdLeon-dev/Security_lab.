import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { z } from "zod";
import { saveToolkitReport } from "@/server/modules/toolkit/toolkit.service";

const schema = z.object({
  input: z.string().min(1).max(100_000),
  algorithms: z
    .array(z.enum(["sha256", "sha512", "md5"]))
    .min(1)
    .max(3)
    .default(["sha256", "sha512"]),
});

export async function POST(request: NextRequest) {
  try {
    const { input, algorithms } = schema.parse(await request.json());

    const hashes = Object.fromEntries(
      algorithms.map((algo) => [algo, createHash(algo).update(input, "utf8").digest("hex")])
    );

    await saveToolkitReport("hash_utilities", `[${algorithms.join(",")}] ${input.slice(0, 60)}`, JSON.stringify(hashes));
    return NextResponse.json({ hashes });
  } catch {
    return NextResponse.json({ error: "Invalid hash request" }, { status: 400 });
  }
}
