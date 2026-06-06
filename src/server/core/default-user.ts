import { prisma } from "@/lib/prisma";

export async function getDefaultUserId() {
  if (!process.env.DATABASE_URL) {
    return "seed-user";
  }

  const existing = await prisma.user.findFirst({
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });

  return existing?.id ?? "seed-user";
}
