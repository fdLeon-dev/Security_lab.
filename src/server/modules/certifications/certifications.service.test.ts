import { describe, expect, it, vi } from "vitest";

const certificationMock = vi.hoisted(() => ({
  findFirst: vi.fn(),
  findMany: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  count: vi.fn(),
  aggregate: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    certification: certificationMock,
  },
}));

import { RecordStatus } from "@prisma/client";
import { createCertification } from "./certifications.service";

describe("createCertification", () => {
  it("auto-populates completionDate for completed certifications", async () => {
    certificationMock.create.mockResolvedValue({
      id: "cert-1",
      status: RecordStatus.COMPLETED,
      completionDate: new Date(),
    });

    await createCertification("user-1", {
      name: "Security+",
      provider: "CompTIA",
      status: RecordStatus.COMPLETED,
      progress: 100,
      notes: "Ready",
    });

    expect(certificationMock.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          completionDate: expect.any(Date),
          progress: 100,
        }),
      })
    );
  });
});
