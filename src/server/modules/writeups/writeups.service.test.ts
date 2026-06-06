import { describe, expect, it, vi } from "vitest";

const prismaWriteupMock = vi.hoisted(() => ({
  findUnique: vi.fn(),
  findFirst: vi.fn(),
  findMany: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    writeup: {
      findUnique: prismaWriteupMock.findUnique,
      findFirst: prismaWriteupMock.findFirst,
      findMany: prismaWriteupMock.findMany,
      create: prismaWriteupMock.create,
      update: prismaWriteupMock.update,
      delete: prismaWriteupMock.remove,
    },
  },
}));

import { WriteupCategory, WriteupVisibility } from "@prisma/client";
import { createWriteup } from "./writeups.service";

describe("createWriteup", () => {
  it("generates a unique slug before persisting", async () => {
    prismaWriteupMock.findUnique.mockResolvedValueOnce({ id: "existing" }).mockResolvedValueOnce(null);
    prismaWriteupMock.create.mockResolvedValue({ id: "w1", slug: "sample-writeup-2" });

    const result = await createWriteup("user-1", {
      title: "Sample Writeup",
      content: "content body here",
      tags: ["TagA", "TagB"],
      category: WriteupCategory.WEB,
      visibility: WriteupVisibility.PRIVATE,
    });

    expect(prismaWriteupMock.findUnique).toHaveBeenCalledTimes(2);
    expect(prismaWriteupMock.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          slug: "sample-writeup-2",
          tags: ["taga", "tagb"],
        }),
      })
    );
    expect(result.slug).toBe("sample-writeup-2");
  });
});
