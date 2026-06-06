import { NextResponse } from "next/server";
import { getLabStats, listLabEntries } from "@/server/modules/labs/labs.service";
import { getDefaultUserId } from "@/server/core/default-user";

export async function GET() {
  try {
    const userId = await getDefaultUserId();
    const [entries, stats] = await Promise.all([
      listLabEntries(userId),
      getLabStats(userId),
    ]);
    return NextResponse.json({ entries, stats });
  } catch {
    return NextResponse.json({ entries: [], stats: { completed: 0, inProgress: 0, total: 0 } });
  }
}
