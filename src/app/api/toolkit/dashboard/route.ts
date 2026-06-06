import { NextResponse } from "next/server";
import { getToolkitDashboard } from "@/server/modules/toolkit/toolkit.service";

export async function GET() {
  try {
    const data = await getToolkitDashboard();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ recent: [], stats: [] });
  }
}
