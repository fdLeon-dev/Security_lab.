import { describe, expect, it, vi, beforeEach } from "vitest";

const prismaMock = vi.hoisted(() => ({
  toolkitReport: {
    create: vi.fn(),
    findMany: vi.fn(),
    groupBy: vi.fn(),
  },
}));

vi.mock("@/lib/prisma", () => ({
  prisma: prismaMock,
}));

import { saveToolkitReport, getToolkitHistory, getToolkitDashboard } from "./toolkit.service";

describe("toolkit service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("saveToolkitReport", () => {
    it("creates a report with sanitized input", async () => {
      prismaMock.toolkitReport.create.mockResolvedValue({ id: "rpt-1" });

      await saveToolkitReport("dns_lookup", "example.com", '["A record"]');

      expect(prismaMock.toolkitReport.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            toolName: "dns_lookup",
            input: "example.com",
            output: '["A record"]',
          }),
        })
      );
    });

    it("strips HTML characters from input via sanitizeText", async () => {
      prismaMock.toolkitReport.create.mockResolvedValue({ id: "rpt-2" });

      await saveToolkitReport("hash_utilities", "<script>alert(1)</script>", "abc123");

      const callData = prismaMock.toolkitReport.create.mock.calls[0][0].data;
      expect(callData.input).not.toContain("<");
      expect(callData.input).not.toContain(">");
    });

    it("truncates input longer than 2000 chars", async () => {
      prismaMock.toolkitReport.create.mockResolvedValue({ id: "rpt-3" });

      const longInput = "x".repeat(3000);
      await saveToolkitReport("base64", longInput, "output");

      const callData = prismaMock.toolkitReport.create.mock.calls[0][0].data;
      expect(callData.input.length).toBeLessThanOrEqual(2000);
    });

    it("truncates output longer than 8000 chars", async () => {
      prismaMock.toolkitReport.create.mockResolvedValue({ id: "rpt-4" });

      const longOutput = "y".repeat(10000);
      await saveToolkitReport("json_formatter", "input", longOutput);

      const callData = prismaMock.toolkitReport.create.mock.calls[0][0].data;
      expect(callData.output.length).toBeLessThanOrEqual(8000);
    });
  });

  describe("getToolkitHistory", () => {
    it("returns history without tool filter", async () => {
      const mockRows = [
        { id: "1", toolName: "dns_lookup", input: "example.com", output: "[]", createdAt: new Date() },
      ];
      prismaMock.toolkitReport.findMany.mockResolvedValue(mockRows);

      const result = await getToolkitHistory();

      expect(prismaMock.toolkitReport.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: undefined, take: 20 })
      );
      expect(result).toHaveLength(1);
    });

    it("filters history by tool name", async () => {
      prismaMock.toolkitReport.findMany.mockResolvedValue([]);

      await getToolkitHistory("ssl_checker");

      expect(prismaMock.toolkitReport.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { toolName: "ssl_checker" } })
      );
    });
  });

  describe("getToolkitDashboard", () => {
    it("returns recent reports and stats", async () => {
      const recentDate = new Date("2026-06-06T10:00:00.000Z");
      prismaMock.toolkitReport.findMany.mockResolvedValue([
        { id: "1", toolName: "dns_lookup", input: "example.com", createdAt: recentDate },
      ]);
      prismaMock.toolkitReport.groupBy.mockResolvedValue([
        { toolName: "dns_lookup", _count: { _all: 5 } },
      ]);

      const result = await getToolkitDashboard();

      expect(result.recent).toHaveLength(1);
      expect(result.recent[0].createdAt).toBe(recentDate.toISOString());
      expect(result.stats).toEqual([{ tool: "dns_lookup", count: 5 }]);
    });
  });
});
