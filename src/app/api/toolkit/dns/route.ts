import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { saveToolkitReport } from "@/server/modules/toolkit/toolkit.service";

const DOMAIN_RE = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)+$/i;

const schema = z.object({
  domain: z
    .string()
    .min(3)
    .max(253)
    .regex(DOMAIN_RE, "Invalid domain name"),
});

export async function POST(request: NextRequest) {
  try {
    const { domain } = schema.parse(await request.json());
    const res = await fetch(
      `https://dns.google/resolve?name=${encodeURIComponent(domain)}`,
      { cache: "no-store" }
    );
    const data = (await res.json()) as { Answer?: unknown[] };
    const records = data.Answer ?? [];
    await saveToolkitReport("dns_lookup", domain, JSON.stringify(records));
    return NextResponse.json({ domain, records });
  } catch {
    return NextResponse.json({ error: "Invalid DNS lookup request" }, { status: 400 });
  }
}
