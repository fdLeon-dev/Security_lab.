import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "devices-security-lab-v2",
    timestamp: new Date().toISOString(),
  });
}
