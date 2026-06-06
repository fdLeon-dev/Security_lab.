"use client";

import { RecordStatus } from "@prisma/client";
import { useCallback, useDeferredValue, useEffect, useMemo, useState, useTransition } from "react";
import { Award, CalendarClock, PencilLine, Plus, Search, Trash2 } from "lucide-react";
import { MetricCard } from "@/components/dashboard/metric-card";

type Certification = {
  id: string;
  name: string;
  provider: string;
  status: RecordStatus;
  startDate: string | null;
  targetDate: string | null;
  completionDate: string | null;
  progress: number;
  notes: string | null;
  evidenceUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

type CertificationDashboard = {
  total: number;
  completed: number;
  inProgress: number;
  averageProgress: number;
  upcoming: Array<{
    id: string;
    name: string;
    targetDate: string | null;
    progress: number;
  }>;
};

type CertificationPayload = {
  entries: Certification[];
  dashboard: CertificationDashboard;
};

type FormState = {
  name: string;
  provider: string;
  status: RecordStatus;
  startDate: string;
  targetDate: string;
  completionDate: string;
  progress: number;
  notes: string;
  evidenceUrl: string;
};

const statusOptions = [
  { value: RecordStatus.PLANNED, label: "Planned" },
  { value: RecordStatus.IN_PROGRESS, label: "In Progress" },
  { value: RecordStatus.COMPLETED, label: "Completed" },
  { value: RecordStatus.BLOCKED, label: "Blocked" },
  { value: RecordStatus.ARCHIVED, label: "Archived" },
];

const emptyForm: FormState = {
  name: "",
  provider: "",
  status: RecordStatus.PLANNED,
  startDate: "",
  targetDate: "",
  completionDate: "",
  progress: 0,
  notes: "",
  evidenceUrl: "",
};

function statusLabel(value: RecordStatus) {
  return statusOptions.find((option) => option.value === value)?.label ?? value;
}

async function parseResponse(response: Response) {
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.error ?? "Request failed");
  }
  return data;
}

export function CertificationTracker() {
  const [entries, setEntries] = useState<Certification[]>([]);
  const [dashboard, setDashboard] = useState<CertificationDashboard>({
    total: 0,
    completed: 0,
    inProgress: 0,
    averageProgress: 0,
    upcoming: [],
  });
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [status, setStatus] = useState("");
  const [provider, setProvider] = useState("");
  const [sortBy, setSortBy] = useState("updatedAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [error, setError] = useState("");
  const [isLoading, startTransition] = useTransition();

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (deferredSearch) params.set("search", deferredSearch);
    if (status) params.set("status", status);
    if (provider) params.set("provider", provider);
    params.set("sortBy", sortBy);
    params.set("sortOrder", sortOrder);
    return params.toString();
  }, [deferredSearch, provider, sortBy, sortOrder, status]);

  const loadData = useCallback(async () => {
    try {
      const response = await fetch(`/api/certifications?${queryString}`, { cache: "no-store" });
      const data = (await parseResponse(response)) as CertificationPayload;
      setEntries(data.entries);
      setDashboard(data.dashboard);
      setError("");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to load certifications");
    }
  }, [queryString]);

  useEffect(() => {
    startTransition(() => {
      void loadData();
    });
  }, [loadData]);

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
  }

  function editEntry(entry: Certification) {
    setEditingId(entry.id);
    setForm({
      name: entry.name,
      provider: entry.provider,
      status: entry.status,
      startDate: entry.startDate ? entry.startDate.slice(0, 10) : "",
      targetDate: entry.targetDate ? entry.targetDate.slice(0, 10) : "",
      completionDate: entry.completionDate ? entry.completionDate.slice(0, 10) : "",
      progress: entry.progress,
      notes: entry.notes ?? "",
      evidenceUrl: entry.evidenceUrl ?? "",
    });
  }

  async function submitForm(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const response = await fetch(editingId ? `/api/certifications/${editingId}` : "/api/certifications", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          startDate: form.startDate ? new Date(form.startDate).toISOString() : null,
          targetDate: form.targetDate ? new Date(form.targetDate).toISOString() : null,
          completionDate: form.completionDate ? new Date(form.completionDate).toISOString() : null,
          notes: form.notes || null,
          evidenceUrl: form.evidenceUrl || null,
        }),
      });
      await parseResponse(response);
      resetForm();
      await loadData();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to save certification");
    }
  }

  async function removeEntry(id: string) {
    try {
      const response = await fetch(`/api/certifications/${id}`, { method: "DELETE" });
      await parseResponse(response);
      if (editingId === id) {
        resetForm();
      }
      await loadData();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to delete certification");
    }
  }

  return (
    <div className="mt-6 space-y-6">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Certificaciones" value={dashboard.total} helper="Ruta total definida" />
        <MetricCard label="Completadas" value={dashboard.completed} helper="Objetivos cerrados" />
        <MetricCard label="En progreso" value={dashboard.inProgress} helper="Preparación activa" />
        <MetricCard label="Progreso promedio" value={`${dashboard.averageProgress}%`} helper="Estado global" />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4">
          <article className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-100">Certification Tracker</h2>
                <p className="mt-1 text-sm text-slate-400">CRUD, fechas objetivo, progreso y evidencias de preparación.</p>
              </div>
              <div className="grid gap-3 md:grid-cols-4 xl:grid-cols-4">
                <label className="relative md:col-span-2">
                  <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por nombre o proveedor" className="w-full rounded-lg border border-slate-700 bg-slate-950 py-2 pl-9 pr-3 text-sm text-slate-100 outline-none ring-sky-400 focus:ring-2" />
                </label>
                <input value={provider} onChange={(event) => setProvider(event.target.value)} placeholder="Proveedor" className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none ring-sky-400 focus:ring-2" />
                <select value={status} onChange={(event) => setStatus(event.target.value)} className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100">
                  <option value="">Todo estado</option>
                  {statusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
                <select value={sortBy} onChange={(event) => setSortBy(event.target.value)} className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100">
                  <option value="updatedAt">Updated</option>
                  <option value="createdAt">Created</option>
                  <option value="targetDate">Target date</option>
                  <option value="progress">Progress</option>
                  <option value="name">Name</option>
                </select>
                <select value={sortOrder} onChange={(event) => setSortOrder(event.target.value)} className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100">
                  <option value="desc">Desc</option>
                  <option value="asc">Asc</option>
                </select>
              </div>
            </div>

            {error ? <p className="mt-4 text-sm text-rose-400">{error}</p> : null}
            {isLoading ? <p className="mt-4 text-sm text-slate-400">Actualizando certificaciones...</p> : null}

            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {entries.map((entry) => (
                <article key={entry.id} className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-base font-semibold text-slate-100">{entry.name}</h3>
                      <p className="mt-1 text-sm text-slate-400">{entry.provider}</p>
                    </div>
                    <span className="rounded-full bg-slate-800 px-2 py-1 text-xs text-slate-300">{statusLabel(entry.status)}</span>
                  </div>
                  <div className="mt-4 h-2 rounded-full bg-slate-800">
                    <div className="h-full rounded-full bg-sky-400" style={{ width: `${entry.progress}%` }} />
                  </div>
                  <p className="mt-2 text-xs text-slate-400">{entry.progress}% progress</p>
                  <div className="mt-4 space-y-1 text-xs text-slate-400">
                    <p>Start: {entry.startDate ? new Date(entry.startDate).toLocaleDateString() : "-"}</p>
                    <p>Target: {entry.targetDate ? new Date(entry.targetDate).toLocaleDateString() : "-"}</p>
                    <p>Completed: {entry.completionDate ? new Date(entry.completionDate).toLocaleDateString() : "-"}</p>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <button type="button" onClick={() => editEntry(entry)} className="rounded-lg border border-slate-700 p-2 text-slate-300 transition hover:border-sky-400/50 hover:text-sky-200"><PencilLine size={14} /></button>
                    <button type="button" onClick={() => removeEntry(entry.id)} className="rounded-lg border border-slate-700 p-2 text-slate-300 transition hover:border-rose-400/50 hover:text-rose-300"><Trash2 size={14} /></button>
                  </div>
                </article>
              ))}
              {!entries.length ? <p className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 text-sm text-slate-400">No hay certificaciones para los filtros actuales.</p> : null}
            </div>
          </article>

          <article className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
            <div className="flex items-center gap-2 text-slate-100">
              <CalendarClock size={18} className="text-cyan-300" />
              <h2 className="text-lg font-semibold">Próximos objetivos</h2>
            </div>
            <div className="mt-4 space-y-3">
              {dashboard.upcoming.map((item) => (
                <div key={item.id} className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-medium text-slate-100">{item.name}</span>
                    <span className="text-xs text-slate-400">{item.targetDate ? new Date(item.targetDate).toLocaleDateString() : "No target"}</span>
                  </div>
                  <div className="mt-3 h-2 rounded-full bg-slate-800">
                    <div className="h-full rounded-full bg-cyan-400" style={{ width: `${item.progress}%` }} />
                  </div>
                </div>
              ))}
              {!dashboard.upcoming.length ? <p className="text-sm text-slate-400">No hay objetivos próximos registrados.</p> : null}
            </div>
          </article>
        </div>

        <aside className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-100">{editingId ? "Editar certificación" : "Nueva certificación"}</h2>
              <p className="mt-1 text-sm text-slate-400">Seguimiento formal del plan de certificación.</p>
            </div>
            <button type="button" onClick={resetForm} className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-200 transition hover:border-sky-400/50"><Plus size={14} />Nuevo</button>
          </div>

          <form onSubmit={submitForm} className="mt-5 space-y-4">
            <div>
              <label className="text-sm text-slate-300">Name</label>
              <input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none ring-sky-400 focus:ring-2" required />
            </div>
            <div>
              <label className="text-sm text-slate-300">Provider</label>
              <input value={form.provider} onChange={(event) => setForm((current) => ({ ...current, provider: event.target.value }))} className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none ring-sky-400 focus:ring-2" required />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm text-slate-300">Status</label>
                <select value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as RecordStatus }))} className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100">
                  {statusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm text-slate-300">Progress</label>
                <input type="number" min={0} max={100} value={form.progress} onChange={(event) => setForm((current) => ({ ...current, progress: Number(event.target.value) }))} className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none ring-sky-400 focus:ring-2" />
              </div>
              <div>
                <label className="text-sm text-slate-300">Start date</label>
                <input type="date" value={form.startDate} onChange={(event) => setForm((current) => ({ ...current, startDate: event.target.value }))} className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100" />
              </div>
              <div>
                <label className="text-sm text-slate-300">Target date</label>
                <input type="date" value={form.targetDate} onChange={(event) => setForm((current) => ({ ...current, targetDate: event.target.value }))} className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100" />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm text-slate-300">Completion date</label>
                <input type="date" value={form.completionDate} onChange={(event) => setForm((current) => ({ ...current, completionDate: event.target.value }))} className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100" />
              </div>
            </div>
            <div>
              <label className="text-sm text-slate-300">Evidence URL</label>
              <input value={form.evidenceUrl} onChange={(event) => setForm((current) => ({ ...current, evidenceUrl: event.target.value }))} className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none ring-sky-400 focus:ring-2" />
            </div>
            <div>
              <label className="text-sm text-slate-300">Notes</label>
              <textarea value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} rows={6} className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none ring-sky-400 focus:ring-2" />
            </div>
            <button type="submit" className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-sky-500 px-4 py-2 font-medium text-slate-950 transition hover:bg-sky-400"><Award size={14} />{editingId ? "Guardar cambios" : "Crear certificación"}</button>
          </form>
        </aside>
      </section>
    </div>
  );
}
