"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { HardDrive, Network, Server, ShieldCheck } from "lucide-react";
import { MetricCard } from "@/components/dashboard/metric-card";

type InventoryDashboard = {
  assets: number;
  virtualMachines: number;
  networks: number;
  services: number;
};

type PaginationPayload<T> = {
  entries: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

type SimpleRef = {
  id: string;
  name: string;
};

type AssetItem = {
  id: string;
  name: string;
  type: string;
  manufacturer: string | null;
  operatingSystem: string | null;
  ipAddress: string | null;
  notes: string | null;
  networkId: string | null;
  network: SimpleRef | null;
  _count: { services: number; virtualMachines: number };
};

type VmItem = {
  id: string;
  name: string;
  os: string;
  resources: string;
  hypervisor: string;
  assetId: string | null;
  networkId: string | null;
  asset: SimpleRef | null;
  network: SimpleRef | null;
};

type NetworkItem = {
  id: string;
  name: string;
  subnet: string;
  gateway: string | null;
  notes: string | null;
  _count: { assets: number; virtualMachines: number };
};

type ServiceItem = {
  id: string;
  name: string;
  protocol: string;
  port: number;
  assetId: string;
  asset: { id: string; name: string; ipAddress: string | null };
};

type AssetForm = {
  name: string;
  type: string;
  manufacturer: string;
  operatingSystem: string;
  ipAddress: string;
  notes: string;
  networkId: string;
};

type VmForm = {
  name: string;
  os: string;
  resources: string;
  hypervisor: string;
  assetId: string;
  networkId: string;
};

type NetworkForm = {
  name: string;
  subnet: string;
  gateway: string;
  notes: string;
};

type ServiceForm = {
  name: string;
  protocol: string;
  port: number;
  assetId: string;
};

const EMPTY_ASSET_FORM: AssetForm = {
  name: "",
  type: "",
  manufacturer: "",
  operatingSystem: "",
  ipAddress: "",
  notes: "",
  networkId: "",
};

const EMPTY_VM_FORM: VmForm = {
  name: "",
  os: "",
  resources: "",
  hypervisor: "",
  assetId: "",
  networkId: "",
};

const EMPTY_NETWORK_FORM: NetworkForm = {
  name: "",
  subnet: "",
  gateway: "",
  notes: "",
};

const EMPTY_SERVICE_FORM: ServiceForm = {
  name: "",
  protocol: "TCP",
  port: 80,
  assetId: "",
};

async function parseResponse<T>(response: Response): Promise<T> {
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(body?.error ?? "Request failed");
  }
  return body as T;
}

function PaginationControls({
  page,
  totalPages,
  onPage,
}: {
  page: number;
  totalPages: number;
  onPage: (next: number) => void;
}) {
  return (
    <div className="mt-4 flex items-center justify-end gap-2 text-sm">
      <button
        type="button"
        className="rounded-md border border-slate-700 px-3 py-1 text-slate-300 disabled:opacity-50"
        disabled={page <= 1}
        onClick={() => onPage(page - 1)}
      >
        Prev
      </button>
      <span className="text-slate-400">
        Page {page} / {Math.max(1, totalPages)}
      </span>
      <button
        type="button"
        className="rounded-md border border-slate-700 px-3 py-1 text-slate-300 disabled:opacity-50"
        disabled={page >= totalPages}
        onClick={() => onPage(page + 1)}
      >
        Next
      </button>
    </div>
  );
}

export function HomeLabInventory() {
  const [isLoading, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<"assets" | "vms" | "networks" | "services">("assets");
  const [dashboard, setDashboard] = useState<InventoryDashboard>({ assets: 0, virtualMachines: 0, networks: 0, services: 0 });
  const [lookups, setLookups] = useState<{ assets: SimpleRef[]; networks: SimpleRef[] }>({ assets: [], networks: [] });
  const [error, setError] = useState("");

  const [assetSearch, setAssetSearch] = useState("");
  const [assetPage, setAssetPage] = useState(1);
  const [assetData, setAssetData] = useState<PaginationPayload<AssetItem>>({ entries: [], total: 0, page: 1, pageSize: 8, totalPages: 1 });
  const [assetForm, setAssetForm] = useState<AssetForm>(EMPTY_ASSET_FORM);
  const [assetEditingId, setAssetEditingId] = useState<string | null>(null);

  const [vmSearch, setVmSearch] = useState("");
  const [vmPage, setVmPage] = useState(1);
  const [vmData, setVmData] = useState<PaginationPayload<VmItem>>({ entries: [], total: 0, page: 1, pageSize: 8, totalPages: 1 });
  const [vmForm, setVmForm] = useState<VmForm>(EMPTY_VM_FORM);
  const [vmEditingId, setVmEditingId] = useState<string | null>(null);

  const [networkSearch, setNetworkSearch] = useState("");
  const [networkPage, setNetworkPage] = useState(1);
  const [networkData, setNetworkData] = useState<PaginationPayload<NetworkItem>>({ entries: [], total: 0, page: 1, pageSize: 8, totalPages: 1 });
  const [networkForm, setNetworkForm] = useState<NetworkForm>(EMPTY_NETWORK_FORM);
  const [networkEditingId, setNetworkEditingId] = useState<string | null>(null);

  const [serviceSearch, setServiceSearch] = useState("");
  const [servicePage, setServicePage] = useState(1);
  const [serviceData, setServiceData] = useState<PaginationPayload<ServiceItem>>({ entries: [], total: 0, page: 1, pageSize: 8, totalPages: 1 });
  const [serviceForm, setServiceForm] = useState<ServiceForm>(EMPTY_SERVICE_FORM);
  const [serviceEditingId, setServiceEditingId] = useState<string | null>(null);

  const tabs = useMemo(
    () => [
      { key: "assets", label: "Assets" },
      { key: "vms", label: "Virtual Machines" },
      { key: "networks", label: "Networks" },
      { key: "services", label: "Services" },
    ] as const,
    []
  );

  const loadDashboard = useCallback(async () => {
    const data = await parseResponse<InventoryDashboard>(await fetch("/api/inventory/dashboard", { cache: "no-store" }));
    setDashboard(data);
  }, []);

  const loadLookups = useCallback(async () => {
    const data = await parseResponse<{ assets: SimpleRef[]; networks: SimpleRef[] }>(
      await fetch("/api/inventory/lookups", { cache: "no-store" })
    );
    setLookups(data);
  }, []);

  const loadAssets = useCallback(async () => {
    const params = new URLSearchParams({ page: String(assetPage), pageSize: "8" });
    if (assetSearch) {
      params.set("search", assetSearch);
    }
    const data = await parseResponse<PaginationPayload<AssetItem>>(
      await fetch(`/api/inventory/assets?${params.toString()}`, { cache: "no-store" })
    );
    setAssetData(data);
  }, [assetPage, assetSearch]);

  const loadVirtualMachines = useCallback(async () => {
    const params = new URLSearchParams({ page: String(vmPage), pageSize: "8" });
    if (vmSearch) {
      params.set("search", vmSearch);
    }
    const data = await parseResponse<PaginationPayload<VmItem>>(
      await fetch(`/api/inventory/virtual-machines?${params.toString()}`, { cache: "no-store" })
    );
    setVmData(data);
  }, [vmPage, vmSearch]);

  const loadNetworks = useCallback(async () => {
    const params = new URLSearchParams({ page: String(networkPage), pageSize: "8" });
    if (networkSearch) {
      params.set("search", networkSearch);
    }
    const data = await parseResponse<PaginationPayload<NetworkItem>>(
      await fetch(`/api/inventory/networks?${params.toString()}`, { cache: "no-store" })
    );
    setNetworkData(data);
  }, [networkPage, networkSearch]);

  const loadServices = useCallback(async () => {
    const params = new URLSearchParams({ page: String(servicePage), pageSize: "8" });
    if (serviceSearch) {
      params.set("search", serviceSearch);
    }
    const data = await parseResponse<PaginationPayload<ServiceItem>>(
      await fetch(`/api/inventory/services?${params.toString()}`, { cache: "no-store" })
    );
    setServiceData(data);
  }, [servicePage, serviceSearch]);

  const loadAll = useCallback(async () => {
    try {
      setError("");
      await Promise.all([
        loadDashboard(),
        loadLookups(),
        loadAssets(),
        loadVirtualMachines(),
        loadNetworks(),
        loadServices(),
      ]);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to load inventory");
    }
  }, [loadAssets, loadDashboard, loadLookups, loadNetworks, loadServices, loadVirtualMachines]);

  useEffect(() => {
    startTransition(() => {
      void loadAll();
    });
  }, [loadAll, startTransition]);

  async function refreshAfterMutation() {
    await Promise.all([loadDashboard(), loadLookups(), loadAssets(), loadVirtualMachines(), loadNetworks(), loadServices()]);
  }

  async function submitAsset(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const response = await fetch(assetEditingId ? `/api/inventory/assets/${assetEditingId}` : "/api/inventory/assets", {
        method: assetEditingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...assetForm,
          manufacturer: assetForm.manufacturer || null,
          operatingSystem: assetForm.operatingSystem || null,
          ipAddress: assetForm.ipAddress || null,
          notes: assetForm.notes || null,
          networkId: assetForm.networkId || null,
        }),
      });
      await parseResponse(response);
      setAssetEditingId(null);
      setAssetForm(EMPTY_ASSET_FORM);
      await refreshAfterMutation();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to save asset");
    }
  }

  async function submitVm(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const response = await fetch(vmEditingId ? `/api/inventory/virtual-machines/${vmEditingId}` : "/api/inventory/virtual-machines", {
        method: vmEditingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...vmForm,
          assetId: vmForm.assetId || null,
          networkId: vmForm.networkId || null,
        }),
      });
      await parseResponse(response);
      setVmEditingId(null);
      setVmForm(EMPTY_VM_FORM);
      await refreshAfterMutation();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to save virtual machine");
    }
  }

  async function submitNetwork(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const response = await fetch(networkEditingId ? `/api/inventory/networks/${networkEditingId}` : "/api/inventory/networks", {
        method: networkEditingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...networkForm,
          gateway: networkForm.gateway || null,
          notes: networkForm.notes || null,
        }),
      });
      await parseResponse(response);
      setNetworkEditingId(null);
      setNetworkForm(EMPTY_NETWORK_FORM);
      await refreshAfterMutation();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to save network");
    }
  }

  async function submitService(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const response = await fetch(serviceEditingId ? `/api/inventory/services/${serviceEditingId}` : "/api/inventory/services", {
        method: serviceEditingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(serviceForm),
      });
      await parseResponse(response);
      setServiceEditingId(null);
      setServiceForm(EMPTY_SERVICE_FORM);
      await refreshAfterMutation();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to save service");
    }
  }

  async function removeItem(path: string) {
    try {
      await parseResponse(await fetch(path, { method: "DELETE" }));
      await refreshAfterMutation();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to delete element");
    }
  }

  return (
    <div className="mt-6 space-y-6">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Equipos" value={dashboard.assets} helper="Assets registrados" />
        <MetricCard label="Maquinas virtuales" value={dashboard.virtualMachines} helper="VMs inventariadas" />
        <MetricCard label="Redes" value={dashboard.networks} helper="Segmentos definidos" />
        <MetricCard label="Servicios" value={dashboard.services} helper="Puertos y protocolos" />
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
        <div className="flex flex-wrap items-center gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`rounded-lg border px-3 py-2 text-sm ${activeTab === tab.key ? "border-sky-400/60 bg-sky-500/10 text-sky-200" : "border-slate-700 text-slate-300"}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {error ? <p className="mt-4 text-sm text-rose-400">{error}</p> : null}
        {isLoading ? <p className="mt-3 text-sm text-slate-400">Cargando inventario...</p> : null}

        {activeTab === "assets" ? (
          <div className="mt-4 grid gap-4 xl:grid-cols-[1.3fr_0.7fr]">
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-slate-100"><HardDrive size={16} />Assets</div>
                <input value={assetSearch} onChange={(event) => { setAssetPage(1); setAssetSearch(event.target.value); }} placeholder="Buscar assets..." className="w-56 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100" />
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="border-b border-slate-800 text-slate-400">
                    <tr><th className="pb-2 pr-3">Nombre</th><th className="pb-2 pr-3">Tipo</th><th className="pb-2 pr-3">OS</th><th className="pb-2 pr-3">IP</th><th className="pb-2 pr-3">Relaciones</th><th className="pb-2">Acciones</th></tr>
                  </thead>
                  <tbody>
                    {assetData.entries.map((item) => (
                      <tr key={item.id} className="border-b border-slate-900 text-slate-200">
                        <td className="py-2 pr-3">{item.name}</td><td className="py-2 pr-3">{item.type}</td><td className="py-2 pr-3">{item.operatingSystem ?? "-"}</td><td className="py-2 pr-3">{item.ipAddress ?? "-"}</td><td className="py-2 pr-3">S:{item._count.services} VM:{item._count.virtualMachines}</td>
                        <td className="py-2">
                          <button type="button" className="mr-2 rounded border border-slate-700 px-2 py-1 text-xs" onClick={() => { setAssetEditingId(item.id); setAssetForm({ name: item.name, type: item.type, manufacturer: item.manufacturer ?? "", operatingSystem: item.operatingSystem ?? "", ipAddress: item.ipAddress ?? "", notes: item.notes ?? "", networkId: item.networkId ?? "" }); }}>Editar</button>
                          <button type="button" className="rounded border border-rose-500/40 px-2 py-1 text-xs text-rose-300" onClick={() => void removeItem(`/api/inventory/assets/${item.id}`)}>Eliminar</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <PaginationControls page={assetData.page} totalPages={assetData.totalPages} onPage={setAssetPage} />
            </div>
            <form onSubmit={submitAsset} className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-3">
              <h3 className="text-sm font-semibold text-slate-100">{assetEditingId ? "Editar asset" : "Nuevo asset"}</h3>
              <input value={assetForm.name} onChange={(event) => setAssetForm((current) => ({ ...current, name: event.target.value }))} placeholder="Nombre" className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm" required />
              <input value={assetForm.type} onChange={(event) => setAssetForm((current) => ({ ...current, type: event.target.value }))} placeholder="Tipo" className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm" required />
              <input value={assetForm.manufacturer} onChange={(event) => setAssetForm((current) => ({ ...current, manufacturer: event.target.value }))} placeholder="Fabricante" className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm" />
              <input value={assetForm.operatingSystem} onChange={(event) => setAssetForm((current) => ({ ...current, operatingSystem: event.target.value }))} placeholder="Sistema operativo" className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm" />
              <input value={assetForm.ipAddress} onChange={(event) => setAssetForm((current) => ({ ...current, ipAddress: event.target.value }))} placeholder="IP" className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm" />
              <select value={assetForm.networkId} onChange={(event) => setAssetForm((current) => ({ ...current, networkId: event.target.value }))} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm">
                <option value="">Sin red</option>
                {lookups.networks.map((network) => <option key={network.id} value={network.id}>{network.name}</option>)}
              </select>
              <textarea value={assetForm.notes} onChange={(event) => setAssetForm((current) => ({ ...current, notes: event.target.value }))} placeholder="Notas" rows={3} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm" />
              <button type="submit" className="w-full rounded-lg bg-sky-500 px-4 py-2 text-sm font-semibold text-slate-950">Guardar asset</button>
            </form>
          </div>
        ) : null}

        {activeTab === "vms" ? (
          <div className="mt-4 grid gap-4 xl:grid-cols-[1.3fr_0.7fr]">
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-slate-100"><Server size={16} />Virtual Machines</div>
                <input value={vmSearch} onChange={(event) => { setVmPage(1); setVmSearch(event.target.value); }} placeholder="Buscar VMs..." className="w-56 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100" />
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="border-b border-slate-800 text-slate-400">
                    <tr><th className="pb-2 pr-3">Nombre</th><th className="pb-2 pr-3">OS</th><th className="pb-2 pr-3">Hypervisor</th><th className="pb-2 pr-3">Asset</th><th className="pb-2 pr-3">Red</th><th className="pb-2">Acciones</th></tr>
                  </thead>
                  <tbody>
                    {vmData.entries.map((item) => (
                      <tr key={item.id} className="border-b border-slate-900 text-slate-200">
                        <td className="py-2 pr-3">{item.name}</td><td className="py-2 pr-3">{item.os}</td><td className="py-2 pr-3">{item.hypervisor}</td><td className="py-2 pr-3">{item.asset?.name ?? "-"}</td><td className="py-2 pr-3">{item.network?.name ?? "-"}</td>
                        <td className="py-2">
                          <button type="button" className="mr-2 rounded border border-slate-700 px-2 py-1 text-xs" onClick={() => { setVmEditingId(item.id); setVmForm({ name: item.name, os: item.os, resources: item.resources, hypervisor: item.hypervisor, assetId: item.assetId ?? "", networkId: item.networkId ?? "" }); }}>Editar</button>
                          <button type="button" className="rounded border border-rose-500/40 px-2 py-1 text-xs text-rose-300" onClick={() => void removeItem(`/api/inventory/virtual-machines/${item.id}`)}>Eliminar</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <PaginationControls page={vmData.page} totalPages={vmData.totalPages} onPage={setVmPage} />
            </div>
            <form onSubmit={submitVm} className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-3">
              <h3 className="text-sm font-semibold text-slate-100">{vmEditingId ? "Editar VM" : "Nueva VM"}</h3>
              <input value={vmForm.name} onChange={(event) => setVmForm((current) => ({ ...current, name: event.target.value }))} placeholder="Nombre" className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm" required />
              <input value={vmForm.os} onChange={(event) => setVmForm((current) => ({ ...current, os: event.target.value }))} placeholder="OS" className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm" required />
              <input value={vmForm.resources} onChange={(event) => setVmForm((current) => ({ ...current, resources: event.target.value }))} placeholder="Resources" className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm" required />
              <input value={vmForm.hypervisor} onChange={(event) => setVmForm((current) => ({ ...current, hypervisor: event.target.value }))} placeholder="Hypervisor" className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm" required />
              <select value={vmForm.assetId} onChange={(event) => setVmForm((current) => ({ ...current, assetId: event.target.value }))} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm">
                <option value="">Sin host asset</option>
                {lookups.assets.map((asset) => <option key={asset.id} value={asset.id}>{asset.name}</option>)}
              </select>
              <select value={vmForm.networkId} onChange={(event) => setVmForm((current) => ({ ...current, networkId: event.target.value }))} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm">
                <option value="">Sin red</option>
                {lookups.networks.map((network) => <option key={network.id} value={network.id}>{network.name}</option>)}
              </select>
              <button type="submit" className="w-full rounded-lg bg-sky-500 px-4 py-2 text-sm font-semibold text-slate-950">Guardar VM</button>
            </form>
          </div>
        ) : null}

        {activeTab === "networks" ? (
          <div className="mt-4 grid gap-4 xl:grid-cols-[1.3fr_0.7fr]">
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-slate-100"><Network size={16} />Networks</div>
                <input value={networkSearch} onChange={(event) => { setNetworkPage(1); setNetworkSearch(event.target.value); }} placeholder="Buscar redes..." className="w-56 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100" />
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="border-b border-slate-800 text-slate-400">
                    <tr><th className="pb-2 pr-3">Nombre</th><th className="pb-2 pr-3">Subnet</th><th className="pb-2 pr-3">Gateway</th><th className="pb-2 pr-3">Relaciones</th><th className="pb-2">Acciones</th></tr>
                  </thead>
                  <tbody>
                    {networkData.entries.map((item) => (
                      <tr key={item.id} className="border-b border-slate-900 text-slate-200">
                        <td className="py-2 pr-3">{item.name}</td><td className="py-2 pr-3">{item.subnet}</td><td className="py-2 pr-3">{item.gateway ?? "-"}</td><td className="py-2 pr-3">A:{item._count.assets} VM:{item._count.virtualMachines}</td>
                        <td className="py-2">
                          <button type="button" className="mr-2 rounded border border-slate-700 px-2 py-1 text-xs" onClick={() => { setNetworkEditingId(item.id); setNetworkForm({ name: item.name, subnet: item.subnet, gateway: item.gateway ?? "", notes: item.notes ?? "" }); }}>Editar</button>
                          <button type="button" className="rounded border border-rose-500/40 px-2 py-1 text-xs text-rose-300" onClick={() => void removeItem(`/api/inventory/networks/${item.id}`)}>Eliminar</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <PaginationControls page={networkData.page} totalPages={networkData.totalPages} onPage={setNetworkPage} />
            </div>
            <form onSubmit={submitNetwork} className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-3">
              <h3 className="text-sm font-semibold text-slate-100">{networkEditingId ? "Editar network" : "Nueva network"}</h3>
              <input value={networkForm.name} onChange={(event) => setNetworkForm((current) => ({ ...current, name: event.target.value }))} placeholder="Nombre" className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm" required />
              <input value={networkForm.subnet} onChange={(event) => setNetworkForm((current) => ({ ...current, subnet: event.target.value }))} placeholder="Subnet" className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm" required />
              <input value={networkForm.gateway} onChange={(event) => setNetworkForm((current) => ({ ...current, gateway: event.target.value }))} placeholder="Gateway" className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm" />
              <textarea value={networkForm.notes} onChange={(event) => setNetworkForm((current) => ({ ...current, notes: event.target.value }))} placeholder="Notas" rows={3} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm" />
              <button type="submit" className="w-full rounded-lg bg-sky-500 px-4 py-2 text-sm font-semibold text-slate-950">Guardar network</button>
            </form>
          </div>
        ) : null}

        {activeTab === "services" ? (
          <div className="mt-4 grid gap-4 xl:grid-cols-[1.3fr_0.7fr]">
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-slate-100"><ShieldCheck size={16} />Services</div>
                <input value={serviceSearch} onChange={(event) => { setServicePage(1); setServiceSearch(event.target.value); }} placeholder="Buscar servicios..." className="w-56 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100" />
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="border-b border-slate-800 text-slate-400">
                    <tr><th className="pb-2 pr-3">Nombre</th><th className="pb-2 pr-3">Protocolo</th><th className="pb-2 pr-3">Puerto</th><th className="pb-2 pr-3">Asset</th><th className="pb-2">Acciones</th></tr>
                  </thead>
                  <tbody>
                    {serviceData.entries.map((item) => (
                      <tr key={item.id} className="border-b border-slate-900 text-slate-200">
                        <td className="py-2 pr-3">{item.name}</td><td className="py-2 pr-3">{item.protocol}</td><td className="py-2 pr-3">{item.port}</td><td className="py-2 pr-3">{item.asset.name}</td>
                        <td className="py-2">
                          <button type="button" className="mr-2 rounded border border-slate-700 px-2 py-1 text-xs" onClick={() => { setServiceEditingId(item.id); setServiceForm({ name: item.name, protocol: item.protocol, port: item.port, assetId: item.assetId }); }}>Editar</button>
                          <button type="button" className="rounded border border-rose-500/40 px-2 py-1 text-xs text-rose-300" onClick={() => void removeItem(`/api/inventory/services/${item.id}`)}>Eliminar</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <PaginationControls page={serviceData.page} totalPages={serviceData.totalPages} onPage={setServicePage} />
            </div>
            <form onSubmit={submitService} className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-3">
              <h3 className="text-sm font-semibold text-slate-100">{serviceEditingId ? "Editar service" : "Nuevo service"}</h3>
              <input value={serviceForm.name} onChange={(event) => setServiceForm((current) => ({ ...current, name: event.target.value }))} placeholder="Nombre" className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm" required />
              <input value={serviceForm.protocol} onChange={(event) => setServiceForm((current) => ({ ...current, protocol: event.target.value }))} placeholder="Protocolo" className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm" required />
              <input type="number" min={1} max={65535} value={serviceForm.port} onChange={(event) => setServiceForm((current) => ({ ...current, port: Number(event.target.value) }))} placeholder="Puerto" className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm" required />
              <select value={serviceForm.assetId} onChange={(event) => setServiceForm((current) => ({ ...current, assetId: event.target.value }))} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm" required>
                <option value="">Selecciona asset</option>
                {lookups.assets.map((asset) => <option key={asset.id} value={asset.id}>{asset.name}</option>)}
              </select>
              <button type="submit" className="w-full rounded-lg bg-sky-500 px-4 py-2 text-sm font-semibold text-slate-950">Guardar service</button>
            </form>
          </div>
        ) : null}
      </section>
    </div>
  );
}
