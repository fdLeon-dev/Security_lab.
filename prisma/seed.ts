import { PrismaClient, RecordStatus, Role, Difficulty } from "@prisma/client";
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
        progress: 45,
      },
      {
        userId: user.id,
        name: "eJPT",
        provider: "INE",
        status: RecordStatus.PLANNED,
        progress: 10,
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
        name: "Blue",
        platform: "Hack The Box",
        category: "Windows",
        difficulty: Difficulty.INTERMEDIATE,
        date: new Date(),
        status: RecordStatus.COMPLETED,
      },
      {
        userId: user.id,
        name: "SOC Level 1",
        platform: "TryHackMe",
        category: "SIEM",
        difficulty: Difficulty.BEGINNER,
        date: new Date(),
        status: RecordStatus.IN_PROGRESS,
      },
    ],
    skipDuplicates: true,
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
