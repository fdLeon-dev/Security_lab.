import { prisma } from "@/lib/prisma";
import { sanitizeText } from "@/lib/security";

export async function listKnowledgeNotes(userId: string) {
  return prisma.knowledgeNote.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    take: 30,
  });
}

export async function createKnowledgeNote(userId: string, input: {
  title: string;
  category: string;
  tags?: string[];
  contentMd: string;
  links?: string[];
}) {
  return prisma.knowledgeNote.create({
    data: {
      userId,
      title: sanitizeText(input.title),
      category: sanitizeText(input.category),
      tags: input.tags ?? [],
      links: input.links ?? [],
      contentMd: input.contentMd,
    },
  });
}
