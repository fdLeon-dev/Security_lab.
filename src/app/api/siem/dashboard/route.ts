import { NextResponse } from "next/server";
import { getDefaultUserId } from "@/server/core/default-user";
import { getSiemDashboard } from "@/server/modules/siem/siem.service";

export async function GET() {
  try {
    const userId = await getDefaultUserId();
    const dashboard = await getSiemDashboard(userId);
    return NextResponse.json(dashboard);
  } catch {
    return NextResponse.json({
      events: [],
      openAlerts: 0,
      closedAlerts: 0,
      rules: 0,
      eventCount: 0,
      alertCount: 0,
      trends: [],
      timeline: [],
    });
  }
}
