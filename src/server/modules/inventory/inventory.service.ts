import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { sanitizeText } from "@/lib/security";

export type PaginationInput = {
  page?: number;
  pageSize?: number;
};

export type AssetFilters = PaginationInput & {
  search?: string;
  type?: string;
  networkId?: string;
  sortBy?: "createdAt" | "updatedAt" | "name" | "type";
  sortOrder?: "asc" | "desc";
};

export type VirtualMachineFilters = PaginationInput & {
  search?: string;
  hypervisor?: string;
  assetId?: string;
  networkId?: string;
  sortBy?: "createdAt" | "updatedAt" | "name" | "hypervisor";
  sortOrder?: "asc" | "desc";
};

export type NetworkFilters = PaginationInput & {
  search?: string;
  sortBy?: "createdAt" | "updatedAt" | "name";
  sortOrder?: "asc" | "desc";
};

export type ServiceFilters = PaginationInput & {
  search?: string;
  protocol?: string;
  assetId?: string;
  sortBy?: "createdAt" | "updatedAt" | "name" | "port";
  sortOrder?: "asc" | "desc";
};

export type AssetInput = {
  name: string;
  type: string;
  manufacturer?: string | null;
  operatingSystem?: string | null;
  ipAddress?: string | null;
  notes?: string | null;
  networkId?: string | null;
};

export type VirtualMachineInput = {
  name: string;
  os: string;
  resources: string;
  hypervisor: string;
  assetId?: string | null;
  networkId?: string | null;
};

export type NetworkInput = {
  name: string;
  subnet: string;
  gateway?: string | null;
  notes?: string | null;
};

export type ServiceInput = {
  name: string;
  protocol: string;
  port: number;
  assetId: string;
};

function normalizePagination(input: PaginationInput = {}) {
  const page = Math.max(1, input.page ?? 1);
  const pageSize = Math.min(50, Math.max(5, input.pageSize ?? 10));
  return {
    page,
    pageSize,
    skip: (page - 1) * pageSize,
  };
}

function sanitizeNullable(value?: string | null) {
  if (value === undefined) {
    return undefined;
  }

  if (!value) {
    return null;
  }

  return sanitizeText(value);
}

function toDirection(order?: "asc" | "desc") {
  return order ?? "desc";
}

export async function listAssets(userId: string, filters: AssetFilters = {}) {
  const pagination = normalizePagination(filters);
  const where: Prisma.AssetWhereInput = {
    userId,
    ...(filters.type ? { type: filters.type } : {}),
    ...(filters.networkId ? { networkId: filters.networkId } : {}),
    ...(filters.search
      ? {
          OR: [
            { name: { contains: filters.search, mode: "insensitive" } },
            { type: { contains: filters.search, mode: "insensitive" } },
            { manufacturer: { contains: filters.search, mode: "insensitive" } },
            { operatingSystem: { contains: filters.search, mode: "insensitive" } },
            { ipAddress: { contains: filters.search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [entries, total] = await Promise.all([
    prisma.asset.findMany({
      where,
      include: {
        network: { select: { id: true, name: true } },
        _count: { select: { services: true, virtualMachines: true } },
      },
      orderBy: {
        [filters.sortBy ?? "updatedAt"]: toDirection(filters.sortOrder),
      },
      skip: pagination.skip,
      take: pagination.pageSize,
    }),
    prisma.asset.count({ where }),
  ]);

  return {
    entries,
    total,
    page: pagination.page,
    pageSize: pagination.pageSize,
    totalPages: Math.max(1, Math.ceil(total / pagination.pageSize)),
  };
}

export async function getAssetById(userId: string, id: string) {
  return prisma.asset.findFirst({
    where: { id, userId },
    include: {
      network: { select: { id: true, name: true } },
      services: true,
      virtualMachines: true,
    },
  });
}

export async function createAsset(userId: string, input: AssetInput) {
  return prisma.asset.create({
    data: {
      userId,
      name: sanitizeText(input.name),
      type: sanitizeText(input.type),
      manufacturer: sanitizeNullable(input.manufacturer),
      operatingSystem: sanitizeNullable(input.operatingSystem),
      ipAddress: sanitizeNullable(input.ipAddress),
      notes: sanitizeNullable(input.notes),
      networkId: input.networkId || null,
    },
  });
}

export async function updateAsset(userId: string, id: string, input: Partial<AssetInput>) {
  const current = await prisma.asset.findFirst({ where: { id, userId } });
  if (!current) {
    return null;
  }

  return prisma.asset.update({
    where: { id },
    data: {
      ...(input.name ? { name: sanitizeText(input.name) } : {}),
      ...(input.type ? { type: sanitizeText(input.type) } : {}),
      ...(input.manufacturer !== undefined ? { manufacturer: sanitizeNullable(input.manufacturer) } : {}),
      ...(input.operatingSystem !== undefined ? { operatingSystem: sanitizeNullable(input.operatingSystem) } : {}),
      ...(input.ipAddress !== undefined ? { ipAddress: sanitizeNullable(input.ipAddress) } : {}),
      ...(input.notes !== undefined ? { notes: sanitizeNullable(input.notes) } : {}),
      ...(input.networkId !== undefined ? { networkId: input.networkId || null } : {}),
    },
  });
}

export async function deleteAsset(userId: string, id: string) {
  const current = await prisma.asset.findFirst({ where: { id, userId } });
  if (!current) {
    return null;
  }

  return prisma.asset.delete({ where: { id } });
}

export async function listVirtualMachines(userId: string, filters: VirtualMachineFilters = {}) {
  const pagination = normalizePagination(filters);
  const where: Prisma.VirtualMachineWhereInput = {
    userId,
    ...(filters.hypervisor ? { hypervisor: filters.hypervisor } : {}),
    ...(filters.assetId ? { assetId: filters.assetId } : {}),
    ...(filters.networkId ? { networkId: filters.networkId } : {}),
    ...(filters.search
      ? {
          OR: [
            { name: { contains: filters.search, mode: "insensitive" } },
            { os: { contains: filters.search, mode: "insensitive" } },
            { resources: { contains: filters.search, mode: "insensitive" } },
            { hypervisor: { contains: filters.search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [entries, total] = await Promise.all([
    prisma.virtualMachine.findMany({
      where,
      include: {
        asset: { select: { id: true, name: true } },
        network: { select: { id: true, name: true } },
      },
      orderBy: {
        [filters.sortBy ?? "updatedAt"]: toDirection(filters.sortOrder),
      },
      skip: pagination.skip,
      take: pagination.pageSize,
    }),
    prisma.virtualMachine.count({ where }),
  ]);

  return {
    entries,
    total,
    page: pagination.page,
    pageSize: pagination.pageSize,
    totalPages: Math.max(1, Math.ceil(total / pagination.pageSize)),
  };
}

export async function getVirtualMachineById(userId: string, id: string) {
  return prisma.virtualMachine.findFirst({
    where: { id, userId },
    include: {
      asset: { select: { id: true, name: true } },
      network: { select: { id: true, name: true } },
    },
  });
}

export async function createVirtualMachine(userId: string, input: VirtualMachineInput) {
  return prisma.virtualMachine.create({
    data: {
      userId,
      name: sanitizeText(input.name),
      os: sanitizeText(input.os),
      resources: sanitizeText(input.resources),
      hypervisor: sanitizeText(input.hypervisor),
      assetId: input.assetId || null,
      networkId: input.networkId || null,
    },
  });
}

export async function updateVirtualMachine(userId: string, id: string, input: Partial<VirtualMachineInput>) {
  const current = await prisma.virtualMachine.findFirst({ where: { id, userId } });
  if (!current) {
    return null;
  }

  return prisma.virtualMachine.update({
    where: { id },
    data: {
      ...(input.name ? { name: sanitizeText(input.name) } : {}),
      ...(input.os ? { os: sanitizeText(input.os) } : {}),
      ...(input.resources ? { resources: sanitizeText(input.resources) } : {}),
      ...(input.hypervisor ? { hypervisor: sanitizeText(input.hypervisor) } : {}),
      ...(input.assetId !== undefined ? { assetId: input.assetId || null } : {}),
      ...(input.networkId !== undefined ? { networkId: input.networkId || null } : {}),
    },
  });
}

export async function deleteVirtualMachine(userId: string, id: string) {
  const current = await prisma.virtualMachine.findFirst({ where: { id, userId } });
  if (!current) {
    return null;
  }

  return prisma.virtualMachine.delete({ where: { id } });
}

export async function listNetworks(userId: string, filters: NetworkFilters = {}) {
  const pagination = normalizePagination(filters);
  const where: Prisma.NetworkWhereInput = {
    userId,
    ...(filters.search
      ? {
          OR: [
            { name: { contains: filters.search, mode: "insensitive" } },
            { subnet: { contains: filters.search, mode: "insensitive" } },
            { gateway: { contains: filters.search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [entries, total] = await Promise.all([
    prisma.network.findMany({
      where,
      include: {
        _count: { select: { assets: true, virtualMachines: true } },
      },
      orderBy: {
        [filters.sortBy ?? "updatedAt"]: toDirection(filters.sortOrder),
      },
      skip: pagination.skip,
      take: pagination.pageSize,
    }),
    prisma.network.count({ where }),
  ]);

  return {
    entries,
    total,
    page: pagination.page,
    pageSize: pagination.pageSize,
    totalPages: Math.max(1, Math.ceil(total / pagination.pageSize)),
  };
}

export async function getNetworkById(userId: string, id: string) {
  return prisma.network.findFirst({
    where: { id, userId },
    include: {
      assets: { select: { id: true, name: true, ipAddress: true } },
      virtualMachines: { select: { id: true, name: true, os: true } },
    },
  });
}

export async function createNetwork(userId: string, input: NetworkInput) {
  return prisma.network.create({
    data: {
      userId,
      name: sanitizeText(input.name),
      subnet: sanitizeText(input.subnet),
      gateway: sanitizeNullable(input.gateway),
      notes: sanitizeNullable(input.notes),
    },
  });
}

export async function updateNetwork(userId: string, id: string, input: Partial<NetworkInput>) {
  const current = await prisma.network.findFirst({ where: { id, userId } });
  if (!current) {
    return null;
  }

  return prisma.network.update({
    where: { id },
    data: {
      ...(input.name ? { name: sanitizeText(input.name) } : {}),
      ...(input.subnet ? { subnet: sanitizeText(input.subnet) } : {}),
      ...(input.gateway !== undefined ? { gateway: sanitizeNullable(input.gateway) } : {}),
      ...(input.notes !== undefined ? { notes: sanitizeNullable(input.notes) } : {}),
    },
  });
}

export async function deleteNetwork(userId: string, id: string) {
  const current = await prisma.network.findFirst({ where: { id, userId } });
  if (!current) {
    return null;
  }

  return prisma.network.delete({ where: { id } });
}

export async function listServices(userId: string, filters: ServiceFilters = {}) {
  const pagination = normalizePagination(filters);
  const where: Prisma.ServiceWhereInput = {
    userId,
    ...(filters.protocol ? { protocol: filters.protocol } : {}),
    ...(filters.assetId ? { assetId: filters.assetId } : {}),
    ...(filters.search
      ? {
          OR: [
            { name: { contains: filters.search, mode: "insensitive" } },
            { protocol: { contains: filters.search, mode: "insensitive" } },
            { asset: { name: { contains: filters.search, mode: "insensitive" } } },
          ],
        }
      : {}),
  };

  const [entries, total] = await Promise.all([
    prisma.service.findMany({
      where,
      include: {
        asset: { select: { id: true, name: true, ipAddress: true } },
      },
      orderBy: {
        [filters.sortBy ?? "updatedAt"]: toDirection(filters.sortOrder),
      },
      skip: pagination.skip,
      take: pagination.pageSize,
    }),
    prisma.service.count({ where }),
  ]);

  return {
    entries,
    total,
    page: pagination.page,
    pageSize: pagination.pageSize,
    totalPages: Math.max(1, Math.ceil(total / pagination.pageSize)),
  };
}

export async function getServiceById(userId: string, id: string) {
  return prisma.service.findFirst({
    where: { id, userId },
    include: {
      asset: { select: { id: true, name: true, ipAddress: true } },
    },
  });
}

export async function createService(userId: string, input: ServiceInput) {
  return prisma.service.create({
    data: {
      userId,
      name: sanitizeText(input.name),
      protocol: sanitizeText(input.protocol).toUpperCase(),
      port: Math.max(1, Math.min(65535, input.port)),
      assetId: input.assetId,
    },
  });
}

export async function updateService(userId: string, id: string, input: Partial<ServiceInput>) {
  const current = await prisma.service.findFirst({ where: { id, userId } });
  if (!current) {
    return null;
  }

  return prisma.service.update({
    where: { id },
    data: {
      ...(input.name ? { name: sanitizeText(input.name) } : {}),
      ...(input.protocol ? { protocol: sanitizeText(input.protocol).toUpperCase() } : {}),
      ...(input.port !== undefined ? { port: Math.max(1, Math.min(65535, input.port)) } : {}),
      ...(input.assetId ? { assetId: input.assetId } : {}),
    },
  });
}

export async function deleteService(userId: string, id: string) {
  const current = await prisma.service.findFirst({ where: { id, userId } });
  if (!current) {
    return null;
  }

  return prisma.service.delete({ where: { id } });
}

export async function getInventoryDashboard(userId: string) {
  const [assets, virtualMachines, networks, services] = await Promise.all([
    prisma.asset.count({ where: { userId } }),
    prisma.virtualMachine.count({ where: { userId } }),
    prisma.network.count({ where: { userId } }),
    prisma.service.count({ where: { userId } }),
  ]);

  return {
    assets,
    virtualMachines,
    networks,
    services,
  };
}

export async function getInventoryLookups(userId: string) {
  const [assets, networks] = await Promise.all([
    prisma.asset.findMany({
      where: { userId },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
      take: 200,
    }),
    prisma.network.findMany({
      where: { userId },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
      take: 200,
    }),
  ]);

  return { assets, networks };
}
