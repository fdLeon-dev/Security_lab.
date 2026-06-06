import { describe, expect, it, vi, beforeEach } from "vitest";

const getPublicPortfolioDataMock = vi.hoisted(() => vi.fn());
const writeAuditLogMock = vi.hoisted(() => vi.fn());

vi.mock("@/server/modules/portfolio/portfolio.service", () => ({
  getPublicPortfolioData: getPublicPortfolioDataMock,
}));

vi.mock("@/server/modules/audit/audit.service", () => ({
  writeAuditLog: writeAuditLogMock,
}));

import { GET } from "./route";

describe("public portfolio route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns portfolio payload and writes audit log", async () => {
    getPublicPortfolioDataMock.mockResolvedValue({
      profile: { name: "Owner", role: "Cybersecurity", summary: "Summary", timelineLabel: "x" },
      projects: [],
      certifications: [],
      writeups: [],
      technologies: [],
      timeline: [],
    });

    const request = new Request("http://localhost:3000/api/public/portfolio", {
      headers: { "user-agent": "vitest" },
    });

    const response = await GET(request as never);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.profile.name).toBe("Owner");
    expect(writeAuditLogMock).toHaveBeenCalled();
  });
});
