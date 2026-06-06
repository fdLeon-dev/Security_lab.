import { NextResponse } from "next/server";
import { getDefaultUserId } from "@/server/core/default-user";
import { getInventoryDashboard } from "@/server/modules/inventory/inventory.service";

export async function GET() {
  try {
    const userId = await getDefaultUserId();
    const dashboard = await getInventoryDashboard(userId);
    return NextResponse.json(dashboard);
  } catch {
    return NextResponse.json({
      assets: 0,
      virtualMachines: 0,
      networks: 0,
      services: 0,
    });
  }
}
