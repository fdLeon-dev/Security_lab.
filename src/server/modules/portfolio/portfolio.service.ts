import { RecordStatus, WriteupVisibility } from "@prisma/client";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";

export type PortfolioData = {
  profile: {
    name: string;
    role: string;
    summary: string;
    timelineLabel: string;
  };
  projects: Array<{
    id: string;
    name: string;
    status: RecordStatus;
    technologies: string[];
    startDate: Date | null;
    dueDate: Date | null;
    evidenceUrl: string | null;
  }>;
  certifications: Array<{
    id: string;
    name: string;
    provider: string;
    status: RecordStatus;
    progress: number;
    startDate: Date | null;
    completionDate: Date | null;
    evidenceUrl: string | null;
  }>;
  writeups: Array<{
    id: string;
    title: string;
    slug: string;
    category: string;
    tags: string[];
    updatedAt: Date;
  }>;
  technologies: Array<{ name: string; count: number }>;
  timeline: Array<{ date: string; title: string; type: string }>;
};

export async function buildPublicPortfolioData(): Promise<PortfolioData> {
  const owner = await prisma.user.findFirst({
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, createdAt: true },
  });

  if (!owner) {
    return {
      profile: {
        name: "Devices Security Lab",
        role: "Cybersecurity Student",
        summary: "Portfolio académico y profesional orientado a ciberseguridad defensiva.",
        timelineLabel: "Sin datos",
      },
      projects: [],
      certifications: [],
      writeups: [],
      technologies: [],
      timeline: [],
    };
  }

  const [projects, certifications, writeups] = await Promise.all([
    prisma.project.findMany({
      where: { userId: owner.id, status: { not: RecordStatus.ARCHIVED } },
      orderBy: [{ updatedAt: "desc" }],
      take: 12,
      select: {
        id: true,
        name: true,
        status: true,
        technologies: true,
        startDate: true,
        dueDate: true,
        evidenceUrl: true,
        updatedAt: true,
      },
    }),
    prisma.certification.findMany({
      where: {
        userId: owner.id,
        status: { in: [RecordStatus.COMPLETED, RecordStatus.IN_PROGRESS, RecordStatus.PLANNED] },
      },
      orderBy: [{ completionDate: "desc" }, { updatedAt: "desc" }],
      take: 12,
      select: {
        id: true,
        name: true,
        provider: true,
        status: true,
        progress: true,
        startDate: true,
        completionDate: true,
        evidenceUrl: true,
      },
    }),
    prisma.writeup.findMany({
      where: { userId: owner.id, visibility: WriteupVisibility.PUBLIC },
      orderBy: [{ updatedAt: "desc" }],
      take: 12,
      select: {
        id: true,
        title: true,
        slug: true,
        category: true,
        tags: true,
        updatedAt: true,
      },
    }),
  ]);

  const technologyCount = new Map<string, number>();
  for (const project of projects) {
    for (const tech of project.technologies) {
      const normalized = tech.trim();
      if (!normalized) continue;
      technologyCount.set(normalized, (technologyCount.get(normalized) ?? 0) + 1);
    }
  }

  const technologies = [...technologyCount.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
    .slice(0, 16);

  const timeline = [
    ...projects.map((project) => ({
      date: (project.startDate ?? project.updatedAt).toISOString(),
      title: `Proyecto: ${project.name}`,
      type: "project",
    })),
    ...certifications.map((certification) => ({
      date: (certification.completionDate ?? certification.startDate ?? new Date()).toISOString(),
      title: `Certificación: ${certification.name} (${certification.provider})`,
      type: "certification",
    })),
    ...writeups.map((writeup) => ({
      date: writeup.updatedAt.toISOString(),
      title: `Writeup público: ${writeup.title}`,
      type: "writeup",
    })),
  ]
    .sort((a, b) => +new Date(b.date) - +new Date(a.date))
    .slice(0, 20);

  return {
    profile: {
      name: owner.name,
      role: "Cybersecurity Analyst / Student",
      summary:
        "Plataforma privada de práctica y laboratorio, con portafolio público orientado a ciberseguridad defensiva, documentación técnica y mejora continua.",
      timelineLabel: owner.createdAt.toISOString(),
    },
    projects,
    certifications,
    writeups,
    technologies,
    timeline,
  };
}

export const getPublicPortfolioData = unstable_cache(buildPublicPortfolioData, ["public-portfolio"], {
  revalidate: 300,
  tags: ["portfolio"],
});
