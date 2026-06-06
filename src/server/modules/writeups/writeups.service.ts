import {
  Prisma,
  WriteupCategory,
  WriteupVisibility,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { sanitizeText } from "@/lib/security";
import { slugify } from "@/lib/utils";

export type WriteupFilters = {
  search?: string;
  category?: WriteupCategory;
  visibility?: WriteupVisibility;
  sortBy?: "createdAt" | "updatedAt" | "title";
  sortOrder?: "asc" | "desc";
};

export type WriteupInput = {
  title: string;
  slug?: string;
  content: string;
  tags: string[];
  category: WriteupCategory;
  visibility: WriteupVisibility;
};

function buildWriteupWhere(userId: string, filters: WriteupFilters): Prisma.WriteupWhereInput {
  return {
    userId,
    ...(filters.category ? { category: filters.category } : {}),
    ...(filters.visibility ? { visibility: filters.visibility } : {}),
    ...(filters.search
      ? {
          OR: [
            { title: { contains: filters.search, mode: "insensitive" } },
            { slug: { contains: filters.search, mode: "insensitive" } },
            { content: { contains: filters.search, mode: "insensitive" } },
            { tags: { has: filters.search.toLowerCase() } },
          ],
        }
      : {}),
  };
}

async function resolveUniqueWriteupSlug(base: string, currentId?: string) {
  const normalizedBase = slugify(base);
  let attempt = normalizedBase;
  let counter = 1;

  while (true) {
    const existing = await prisma.writeup.findUnique({
      where: { slug: attempt },
      select: { id: true },
    });

    if (!existing || existing.id === currentId) {
      return attempt;
    }

    counter += 1;
    attempt = `${normalizedBase}-${counter}`;
  }
}

export async function listWriteups(userId: string, filters: WriteupFilters = {}) {
  return prisma.writeup.findMany({
    where: buildWriteupWhere(userId, filters),
    orderBy: {
      [filters.sortBy ?? "updatedAt"]: filters.sortOrder ?? "desc",
    },
    take: 100,
  });
}

export async function getWriteupById(userId: string, id: string) {
  return prisma.writeup.findFirst({
    where: { id, userId },
  });
}

export async function createWriteup(userId: string, input: WriteupInput) {
  const slug = await resolveUniqueWriteupSlug(input.slug?.trim() || input.title);

  return prisma.writeup.create({
    data: {
      userId,
      title: sanitizeText(input.title),
      slug,
      content: input.content,
      tags: input.tags.map((tag) => sanitizeText(tag.toLowerCase())).filter(Boolean),
      category: input.category,
      visibility: input.visibility,
    },
  });
}

export async function updateWriteup(userId: string, id: string, input: Partial<WriteupInput>) {
  const current = await getWriteupById(userId, id);
  if (!current) {
    return null;
  }

  const slug = input.slug || input.title
    ? await resolveUniqueWriteupSlug(input.slug?.trim() || input.title || current.slug, current.id)
    : current.slug;

  return prisma.writeup.update({
    where: { id },
    data: {
      ...(input.title ? { title: sanitizeText(input.title) } : {}),
      ...(input.content !== undefined ? { content: input.content } : {}),
      ...(input.tags ? { tags: input.tags.map((tag) => sanitizeText(tag.toLowerCase())).filter(Boolean) } : {}),
      ...(input.category ? { category: input.category } : {}),
      ...(input.visibility ? { visibility: input.visibility } : {}),
      slug,
    },
  });
}

export async function deleteWriteup(userId: string, id: string) {
  const current = await getWriteupById(userId, id);
  if (!current) {
    return null;
  }

  return prisma.writeup.delete({
    where: { id },
  });
}
