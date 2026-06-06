import { beforeEach, describe, expect, it, vi } from "vitest";

const prismaMock = vi.hoisted(() => ({
  user: { findFirst: vi.fn() },
  project: { findMany: vi.fn() },
  certification: { findMany: vi.fn() },
  writeup: { findMany: vi.fn() },
}));

vi.mock("next/cache", () => ({
  unstable_cache: (fn: (...args: unknown[]) => unknown) => fn,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: prismaMock,
}));

import { buildPublicPortfolioData } from "./portfolio.service";

describe("portfolio service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns empty portfolio when owner does not exist", async () => {
    prismaMock.user.findFirst.mockResolvedValue(null);

    const result = await buildPublicPortfolioData();

    expect(result.projects).toEqual([]);
    expect(result.certifications).toEqual([]);
    expect(result.writeups).toEqual([]);
    expect(result.technologies).toEqual([]);
  });

  it("aggregates technologies and timeline with sorted events", async () => {
    prismaMock.user.findFirst.mockResolvedValue({
      id: "user-1",
      name: "Owner",
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
    });

    prismaMock.project.findMany.mockResolvedValue([
      {
        id: "p1",
        name: "Lab SIEM",
        status: "IN_PROGRESS",
        technologies: ["Next.js", "Prisma", "Next.js"],
        startDate: new Date("2026-03-01T00:00:00.000Z"),
        dueDate: null,
        evidenceUrl: null,
        updatedAt: new Date("2026-04-01T00:00:00.000Z"),
      },
    ]);

    prismaMock.certification.findMany.mockResolvedValue([
      {
        id: "c1",
        name: "Security+",
        provider: "CompTIA",
        status: "IN_PROGRESS",
        progress: 45,
        startDate: new Date("2026-02-01T00:00:00.000Z"),
        completionDate: null,
        evidenceUrl: null,
      },
    ]);

    prismaMock.writeup.findMany.mockResolvedValue([
      {
        id: "w1",
        title: "Public Writeup",
        slug: "public-writeup",
        category: "WEB",
        tags: ["xss"],
        updatedAt: new Date("2026-05-01T00:00:00.000Z"),
      },
    ]);

    const result = await buildPublicPortfolioData();

    expect(result.technologies).toEqual([
      { name: "Next.js", count: 2 },
      { name: "Prisma", count: 1 },
    ]);
    expect(result.timeline[0].title).toContain("Writeup público");
    expect(result.timeline).toHaveLength(3);
  });
});
