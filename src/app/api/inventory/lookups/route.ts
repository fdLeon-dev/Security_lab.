import { NextResponse } from "next/server";
import { getDefaultUserId } from "@/server/core/default-user";
import { getInventoryLookups } from "@/server/modules/inventory/inventory.service";

export async function GET() {
  try {
    const userId = await getDefaultUserId();
    const lookups = await getInventoryLookups(userId);
    return NextResponse.json(lookups);
  } catch {
    return NextResponse.json({ assets: [], networks: [] });
  }
}
