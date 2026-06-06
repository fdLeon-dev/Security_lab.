import {
  PrismaClient,
  RecordStatus,
  Role,
  Difficulty,
  LabCategory,
  LabPlatform,
  WriteupCategory,
  WriteupVisibility,
} from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("ChangeMe123!", 10);

  const user = await prisma.user.upsert({
    where: { email: "owner@deviceslab.local" },
    update: {},
    create: {
      email: "owner@deviceslab.local",
      name: "Lab Owner",
      passwordHash,
      role: Role.OWNER,
    },
  });

  await prisma.goal.createMany({
    data: [
      {
        userId: user.id,
        title: "Completar ruta Linux Foundations",
        status: RecordStatus.IN_PROGRESS,
        progress: 65,
      },
      {
        userId: user.id,
        title: "Finalizar writeup AD básico",
        status: RecordStatus.PLANNED,
        progress: 15,
      },
    ],
    skipDuplicates: true,
  });

  await prisma.certification.createMany({
    data: [
      {
        userId: user.id,
        name: "CompTIA Security+",
        provider: "CompTIA",
        status: RecordStatus.IN_PROGRESS,
        startDate: new Date("2026-03-01T00:00:00.000Z"),
        targetDate: new Date("2026-09-15T00:00:00.000Z"),
        progress: 45,
        notes: "Plan semanal de dominios y simulacros.",
        evidenceUrl: "https://example.com/evidence/security-plus-plan",
      },
      {
        userId: user.id,
        name: "eJPT",
        provider: "INE",
        status: RecordStatus.PLANNED,
        startDate: new Date("2026-07-01T00:00:00.000Z"),
        targetDate: new Date("2026-12-10T00:00:00.000Z"),
        progress: 10,
        notes: "Preparar networking, web y labs previos.",
      },
    ],
    skipDuplicates: true,
  });

  const course = await prisma.learningCourse.upsert({
    where: { id: "seed-linux-course" },
    update: {},
    create: {
      id: "seed-linux-course",
      userId: user.id,
      title: "Fundamentos Cyber de Linux",
      category: "Linux",
      status: RecordStatus.IN_PROGRESS,
      progress: 52,
      minutes: 880,
      startedAt: new Date(),
    },
  });

  await prisma.learningModule.upsert({
    where: { courseId_order: { courseId: course.id, order: 1 } },
    update: {},
    create: {
      courseId: course.id,
      title: "Permisos, procesos y hardening",
      order: 1,
      progress: 60,
    },
  });

  await prisma.labEntry.createMany({
    data: [
      {
        userId: user.id,
        title: "Blue",
        platform: LabPlatform.HACK_THE_BOX,
        category: LabCategory.WINDOWS,
        difficulty: Difficulty.INTERMEDIATE,
        status: RecordStatus.COMPLETED,
        completedAt: new Date(),
        notes: "Enumeracion SMB y escalada de privilegios en entorno Windows.",
      },
      {
        userId: user.id,
        title: "SOC Level 1",
        platform: LabPlatform.TRY_HACK_ME,
        category: LabCategory.NETWORK,
        difficulty: Difficulty.BEGINNER,
        status: RecordStatus.IN_PROGRESS,
        notes: "Escenario orientado a monitoreo y analisis defensivo.",
      },
    ],
    skipDuplicates: true,
  });

  await prisma.writeup.upsert({
    where: { slug: "blue-windows-writeup" },
    update: {},
    create: {
      userId: user.id,
      title: "Blue Windows Writeup",
      slug: "blue-windows-writeup",
      content: "# Blue\n\n## Resumen\n\nLaboratorio orientado a Windows con foco en SMB, enumeracion y escalada.\n\n```powershell\nGet-SmbShare\n```\n\n![Arquitectura](https://images.unsplash.com/photo-1516321318423-f06f85e504b3)",
      tags: ["windows", "smb", "htb"],
      category: WriteupCategory.WINDOWS,
      visibility: WriteupVisibility.PRIVATE,
    },
  });

  await prisma.knowledgeNote.createMany({
    data: [
      {
        userId: user.id,
        title: "Checklist inicial hardening Linux",
        category: "Linux",
        tags: ["hardening", "ssh", "ufw"],
        links: ["[[SIEM detecciones SSH]]"],
        contentMd: "# Hardening Linux\n\n- Deshabilitar root login\n- Activar UFW\n- Configurar fail2ban",
      },
    ],
    skipDuplicates: true,
  });

  await prisma.inventoryAsset.createMany({
    data: [
      {
        userId: user.id,
        name: "Proxmox Node",
        type: "Servidor",
        ipAddress: "192.168.1.20",
        os: "Debian 12",
        topologyLabel: "Core-Lab",
      },
      {
        userId: user.id,
        name: "Kali VM",
        type: "Virtual Machine",
        ipAddress: "192.168.1.55",
        os: "Kali Linux",
        topologyLabel: "SOC-VLAN",
      },
    ],
    skipDuplicates: true,
  });

  await prisma.siemRule.createMany({
    data: [
      {
        name: "Múltiples fallos de login",
        condition: "failed_logins > 5 in 5m",
        severity: 6,
      },
      {
        name: "PowerShell sospechoso",
        condition: "process_name=powershell AND encoded_command=true",
        severity: 8,
      },
    ],
    skipDuplicates: true,
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
