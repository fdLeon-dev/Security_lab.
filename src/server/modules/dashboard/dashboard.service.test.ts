import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    studySession: {
      aggregate: vi.fn().mockResolvedValue({ _sum: { minutes: 180 } }),
    },
    goal: {
      count: vi.fn().mockResolvedValue(4),
    },
    certification: {
      count: vi.fn().mockResolvedValue(2),
    },
    labEntry: {
      count: vi.fn().mockResolvedValue(8),
    },
    project: {
      count: vi.fn().mockResolvedValue(3),
    },
    learningCourse: {
      findMany: vi.fn().mockResolvedValue([{ title: "Linux", progress: 50 }]),
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
  });
});
