import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  domain: z.string().min(3),
});

export async function POST(request: NextRequest) {
  try {
    const { domain } = schema.parse(await request.json());
    const response = await fetch(`https://dns.google/resolve?name=${encodeURIComponent(domain)}`, {
      cache: "no-store",
    });
    const data = await response.json();
    return NextResponse.json({
      domain,
      records: data.Answer ?? [],
    });
  } catch {
    return NextResponse.json({ error: "Invalid DNS lookup request" }, { status: 400 });
  }
}
