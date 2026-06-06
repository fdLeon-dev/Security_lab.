import { NextRequest, NextResponse } from "next/server";
import { getPublicPortfolioData } from "@/server/modules/portfolio/portfolio.service";
import { writeAuditLog } from "@/server/modules/audit/audit.service";

export async function GET(request: NextRequest) {
  try {
    const data = await getPublicPortfolioData();

    await writeAuditLog({
      action: "READ_PUBLIC_PORTFOLIO",
      resource: "portfolio",
      ipAddress: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
      userAgent: request.headers.get("user-agent"),
    });

    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    });
  } catch {
    return NextResponse.json(
      {
        profile: {
          name: "Devices Security Lab",
          role: "Cybersecurity Student",
          summary: "Portfolio académico y profesional.",
          timelineLabel: "N/A",
        },
        projects: [],
        certifications: [],
        writeups: [],
        technologies: [],
        timeline: [],
      },
      { status: 200 }
    );
  }
}
