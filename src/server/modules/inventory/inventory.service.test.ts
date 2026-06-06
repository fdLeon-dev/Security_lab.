import { describe, expect, it, vi } from "vitest";

const prismaMock = vi.hoisted(() => ({
  asset: {
    create: vi.fn(),
  },
  service: {
    create: vi.fn(),
  },
}));

vi.mock("@/lib/prisma", () => ({
  prisma: prismaMock,
}));

import { createAsset, createService } from "./inventory.service";

describe("inventory service", () => {
  it("sanitizes asset fields on create", async () => {
    prismaMock.asset.create.mockResolvedValue({ id: "asset-1" });

    await createAsset("user-1", {
      name: "<Lab Host>",
      type: "Server",
      manufacturer: "<Dell>",
      operatingSystem: "Debian",
      ipAddress: "192.168.1.10",
      notes: "<critical>",
      networkId: null,
    });

    expect(prismaMock.asset.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          name: "Lab Host",
          manufacturer: "Dell",
          notes: "critical",
        }),
      })
    );
  });

  it("normalizes protocol and clamps service port", async () => {
    prismaMock.service.create.mockResolvedValue({ id: "svc-1" });

    await createService("user-1", {
      name: "ssh",
      protocol: "tcp",
      port: 70000,
      assetId: "asset-1",
    });

    expect(prismaMock.service.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          protocol: "TCP",
          port: 65535,
        }),
      })
    );
  });
});
