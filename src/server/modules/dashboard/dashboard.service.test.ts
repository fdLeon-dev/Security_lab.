import { describe, expect, it, vi } from "vitest";

const fixedDate = new Date("2026-06-06T12:00:00.000Z");
vi.useFakeTimers();
vi.setSystemTime(fixedDate);

vi.mock("@/lib/prisma", () => ({
  prisma: {
    studySession: {
      aggregate: vi
        .fn()
        .mockResolvedValueOnce({ _sum: { minutes: 180 } })
        .mockResolvedValueOnce({ _sum: { minutes: 60 } })
        .mockResolvedValueOnce({ _sum: { minutes: 300 } }),
      findMany: vi.fn().mockResolvedValue([
        { id: "s1", focusArea: "Linux", startedAt: new Date("2026-06-01T10:00:00.000Z"), minutes: 120 },
      ]),
    },
    goal: {
      count: vi.fn().mockResolvedValueOnce(4).mockResolvedValueOnce(2),
      findMany: vi.fn().mockResolvedValue([
        { id: "g1", title: "Finish module", status: "IN_PROGRESS", updatedAt: new Date("2026-06-02T12:00:00.000Z"), progress: 45 },
      ]),
    },
    certification: {
      count: vi.fn().mockResolvedValueOnce(2).mockResolvedValueOnce(1).mockResolvedValueOnce(1),
      findMany: vi.fn().mockResolvedValue([
        { id: "c1", name: "Security+", status: "IN_PROGRESS", updatedAt: new Date("2026-06-03T12:00:00.000Z"), progress: 65 },
      ]),
      aggregate: vi.fn().mockResolvedValue({ _avg: { progress: 55 } }),
    },
    labEntry: {
      count: vi.fn().mockResolvedValueOnce(8).mockResolvedValueOnce(1).mockResolvedValueOnce(3),
      findMany: vi.fn().mockResolvedValue([
        { id: "l1", title: "Blue", status: "COMPLETED", updatedAt: new Date("2026-06-04T12:00:00.000Z"), category: "WINDOWS" },
      ]),
    },
    project: {
      count: vi.fn().mockResolvedValue(3),
    },
    learningCourse: {
      findMany: vi.fn().mockResolvedValue([{ title: "Linux", progress: 50 }]),
      count: vi.fn().mockResolvedValueOnce(1).mockResolvedValueOnce(2),
    },
  },
}));

import { getDashboardMetrics } from "./dashboard.service";

describe("getDashboardMetrics", () => {
  it("returns transformed metrics", async () => {
    const metrics = await getDashboardMetrics("user-id");

    expect(metrics.totalStudyHours).toBe(3);
    expect(metrics.goalsCompleted).toBe(4);
    expect(metrics.certifications).toBe(2);
    expect(metrics.labsCompleted).toBe(8);
    expect(metrics.activeProjects).toBe(3);
    expect(metrics.courses).toHaveLength(1);
    expect(metrics.activeCourses).toBe(2);
    expect(metrics.completedCourses).toBe(1);
    expect(metrics.monthlyEvolution).toHaveLength(6);
    expect(metrics.recentActivity.length).toBeGreaterThan(0);
    expect(metrics.monthlySummary.studyHours).toBe(1);
    expect(metrics.annualProgress.year).toBe(2026);
  });
});
