import { describe, expect, it, vi } from "vitest";

const prismaMock = vi.hoisted(() => ({
  siemEvent: {
    create: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    count: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    groupBy: vi.fn(),
  },
  siemRule: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  },
  siemAlert: {
    create: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    count: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock("@/lib/prisma", () => ({
  prisma: prismaMock,
}));

import { SiemAlertStatus, SiemEventCategory } from "@prisma/client";
import { classifyEvent, getSiemDashboard } from "./siem.service";

describe("siem service", () => {
  it("creates an academic alert when classifying an event", async () => {
    prismaMock.siemEvent.findFirst.mockResolvedValue({
      id: "event-1",
      userId: "user-1",
      source: "Lab Gateway",
      category: SiemEventCategory.AUTHENTICATION,
      severity: 7,
      timestamp: new Date("2026-06-06T10:00:00.000Z"),
      description: "Academic login failures",
      alerts: [],
    });
    prismaMock.siemRule.findMany.mockResolvedValue([
      { id: "rule-1", name: "Auth review", severity: 6 },
    ]);
    prismaMock.siemAlert.create.mockResolvedValue({ id: "alert-1" });

    const result = await classifyEvent("user-1", "event-1");

    expect(prismaMock.siemAlert.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: "user-1",
          eventId: "event-1",
          ruleId: "rule-1",
          severity: 7,
          status: SiemAlertStatus.ACKNOWLEDGED,
        }),
      })
    );
    expect(result?.alert.id).toBe("alert-1");
  });

  it("returns dashboard aggregates for the academic SIEM", async () => {
    prismaMock.siemEvent.findMany.mockResolvedValue([
      {
        id: "event-1",
        source: "Lab Gateway",
        category: SiemEventCategory.AUTHENTICATION,
        severity: 5,
        timestamp: new Date("2026-06-06T10:00:00.000Z"),
        description: "Academic login failures",
      },
    ]);
    prismaMock.siemAlert.count
      .mockResolvedValueOnce(2)
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(3);
    prismaMock.siemAlert.findMany.mockResolvedValue([
      {
        id: "alert-1",
        title: "Review",
        severity: 5,
        status: SiemAlertStatus.OPEN,
        createdAt: new Date("2026-06-06T10:00:00.000Z"),
      },
    ]);
    prismaMock.siemEvent.groupBy.mockResolvedValue([
      { severity: 5, _count: { _all: 1 } },
    ]);
    prismaMock.siemRule.count.mockResolvedValue(1);
    prismaMock.siemEvent.count.mockResolvedValue(1);

    const dashboard = await getSiemDashboard("user-1");

    expect(dashboard.openAlerts).toBe(2);
    expect(dashboard.closedAlerts).toBe(1);
    expect(dashboard.rules).toBe(1);
    expect(dashboard.eventCount).toBe(1);
    expect(dashboard.alertCount).toBe(3);
    expect(dashboard.trends).toHaveLength(1);
  });
});
