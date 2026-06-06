"use client";

import {
  Difficulty,
  LabCategory,
  LabPlatform,
  RecordStatus,
} from "@prisma/client";
import { useDeferredValue, useEffect, useMemo, useState, useTransition } from "react";
import { BarChart3, FlaskConical, PencilLine, Plus, Search, Trash2 } from "lucide-react";
import { MetricCard } from "@/components/dashboard/metric-card";
import { cn } from "@/lib/utils";

type Lab = {
  id: string;
  title: string;
  platform: LabPlatform;
  category: LabCategory;
  difficulty: Difficulty;
  status: RecordStatus;
  notes: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type DistributionItem = {
  category?: LabCategory;
  difficulty?: Difficulty;
  count: number;
};

type LabDashboard = {
  completed: number;
  pending: number;
  total: number;
  byCategory: DistributionItem[];
  byDifficulty: DistributionItem[];
};

type LabsPayload = {
  entries: Lab[];
  stats: LabDashboard;
};

type LabFormState = {
  title: string;
  platform: LabPlatform;
  category: LabCategory;
  difficulty: Difficulty;
  status: RecordStatus;
  notes: string;
  completedAt: string;
};

const platformOptions = [
  { value: LabPlatform.HACK_THE_BOX, label: "Hack The Box" },
  { value: LabPlatform.TRY_HACK_ME, label: "TryHackMe" },
  { value: LabPlatform.PORTSWIGGER, label: "PortSwigger" },
  { value: LabPlatform.DOCKER_LABS, label: "Docker Labs" },
  { value: LabPlatform.LOCAL_LAB, label: "Local Lab" },
];

const categoryOptions = [
  { value: LabCategory.LINUX, label: "Linux" },
  { value: LabCategory.WINDOWS, label: "Windows" },
  { value: LabCategory.WEB, label: "Web" },
  { value: LabCategory.ACTIVE_DIRECTORY, label: "Active Directory" },
  { value: LabCategory.CLOUD, label: "Cloud" },
  { value: LabCategory.NETWORK, label: "Network" },
];

const difficultyOptions = [
  { value: Difficulty.BEGINNER, label: "Beginner" },
  { value: Difficulty.INTERMEDIATE, label: "Intermediate" },
  { value: Difficulty.ADVANCED, label: "Advanced" },
  { value: Difficulty.EXPERT, label: "Expert" },
];

const statusOptions = [
  { value: RecordStatus.PLANNED, label: "Planned" },
  { value: RecordStatus.IN_PROGRESS, label: "In Progress" },
  { value: RecordStatus.COMPLETED, label: "Completed" },
  { value: RecordStatus.BLOCKED, label: "Blocked" },
  { value: RecordStatus.ARCHIVED, label: "Archived" },
];

const emptyForm: LabFormState = {
  title: "",
  platform: LabPlatform.HACK_THE_BOX,
  category: LabCategory.WEB,
  difficulty: Difficulty.BEGINNER,
  status: RecordStatus.PLANNED,
  notes: "",
  completedAt: "",
};

function enumLabel(value: string, options: Array<{ value: string; label: string }>) {
  return options.find((option) => option.value === value)?.label ?? value;
}

async function parseResponse(response: Response) {
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.error ?? "Request failed");
  }
  return data;
}

export function LabManager() {
  const [labs, setLabs] = useState<Lab[]>([]);
  const [stats, setStats] = useState<LabDashboard>({
    completed: 0,
    pending: 0,
    total: 0,
    byCategory: [],
    byDifficulty: [],
  });
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [platform, setPlatform] = useState("");
  const [category, setCategory] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [status, setStatus] = useState("");
  const [sortBy, setSortBy] = useState("updatedAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<LabFormState>(emptyForm);
  const [error, setError] = useState("");
  const [loading, startTransition] = useTransition();

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (deferredSearch) params.set("search", deferredSearch);
    if (platform) params.set("platform", platform);
    if (category) params.set("category", category);
    if (difficulty) params.set("difficulty", difficulty);
    if (status) params.set("status", status);
    params.set("sortBy", sortBy);
    params.set("sortOrder", sortOrder);
    return params.toString();
  }, [category, deferredSearch, difficulty, platform, sortBy, sortOrder, status]);

  useEffect(() => {
    startTransition(async () => {
      try {
        const response = await fetch(`/api/labs?${queryString}`, { cache: "no-store" });
        const data = (await parseResponse(response)) as LabsPayload;
        setLabs(data.entries);
        setStats(data.stats);
        setError("");
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : "Unable to load labs");
      }
    });
  }, [queryString]);

  function populateForm(lab: Lab) {
    setEditingId(lab.id);
    setForm({
      title: lab.title,
      platform: lab.platform,
      category: lab.category,
      difficulty: lab.difficulty,
      status: lab.status,
      notes: lab.notes ?? "",
      completedAt: lab.completedAt ? lab.completedAt.slice(0, 16) : "",
    });
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
  }

  async function submitForm(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    try {
      const response = await fetch(editingId ? `/api/labs/${editingId}` : "/api/labs", {
        method: editingId ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...form,
          notes: form.notes || null,
          completedAt: form.completedAt ? new Date(form.completedAt).toISOString() : null,
        }),
      });

      await parseResponse(response);
      resetForm();
      const refresh = await fetch(`/api/labs?${queryString}`, { cache: "no-store" });
      const data = (await parseResponse(refresh)) as LabsPayload;
      setLabs(data.entries);
      setStats(data.stats);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to save lab");
    }
  }

  async function handleDelete(id: string) {
    try {
      const response = await fetch(`/api/labs/${id}`, { method: "DELETE" });
      await parseResponse(response);
      setLabs((current) => current.filter((item) => item.id !== id));
      setStats((current) => ({
        ...current,
        total: Math.max(0, current.total - 1),
      }));
      if (editingId === id) {
        resetForm();
      }
      const refresh = await fetch(`/api/labs?${queryString}`, { cache: "no-store" });
      const data = (await parseResponse(refresh)) as LabsPayload;
      setLabs(data.entries);
      setStats(data.stats);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to delete lab");
    }
  }

  return (
    <div className="mt-6 space-y-6">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Labs completados" value={stats.completed} helper="Cerrados con evidencia" />
        <MetricCard label="Labs pendientes" value={stats.pending} helper="Planned, in progress o blocked" />
        <MetricCard label="Total de labs" value={stats.total} helper="Base histórica visible" />
        <MetricCard label="Cobertura" value={`${stats.total ? Math.round((stats.completed / stats.total) * 100) : 0}%`} helper="Ratio completado" />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <article className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
              <div className="mb-4 flex items-center gap-2 text-slate-100">
                <BarChart3 size={18} className="text-sky-300" />
                <h2 className="text-lg font-semibold">Distribución por categoría</h2>
              </div>
              <div className="space-y-3">
                {stats.byCategory.map((item) => {
                  const width = stats.total ? (item.count / stats.total) * 100 : 0;
                  return (
                    <div key={item.category}>
                      <div className="mb-1 flex items-center justify-between text-sm text-slate-300">
                        <span>{enumLabel(item.category ?? "", categoryOptions)}</span>
                        <span>{item.count}</span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-800">
                        <div className="h-full rounded-full bg-sky-400" style={{ width: `${width}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </article>

            <article className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
              <div className="mb-4 flex items-center gap-2 text-slate-100">
                <FlaskConical size={18} className="text-cyan-300" />
                <h2 className="text-lg font-semibold">Distribución por dificultad</h2>
              </div>
              <div className="space-y-3">
                {stats.byDifficulty.map((item) => {
                  const width = stats.total ? (item.count / stats.total) * 100 : 0;
                  return (
                    <div key={item.difficulty}>
                      <div className="mb-1 flex items-center justify-between text-sm text-slate-300">
                        <span>{enumLabel(item.difficulty ?? "", difficultyOptions)}</span>
                        <span>{item.count}</span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-800">
                        <div className="h-full rounded-full rounded-full bg-cyan-400" style={{ width: `${width}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </article>
          </div>

          <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-100">Inventario de laboratorios</h2>
                <p className="mt-1 text-sm text-slate-400">Busca, filtra, ordena y opera el CRUD desde una sola vista.</p>
              </div>
              <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
                <label className="relative md:col-span-3 xl:col-span-2">
                  <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Buscar por título o notas"
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 py-2 pl-9 pr-3 text-sm text-slate-100 outline-none ring-sky-400 focus:ring-2"
                  />
                </label>
                <select value={platform} onChange={(event) => setPlatform(event.target.value)} className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100">
                  <option value="">Todas las plataformas</option>
                  {platformOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
                <select value={category} onChange={(event) => setCategory(event.target.value)} className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100">
                  <option value="">Todas las categorías</option>
                  {categoryOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
                <select value={difficulty} onChange={(event) => setDifficulty(event.target.value)} className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100">
                  <option value="">Toda dificultad</option>
                  {difficultyOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
                <select value={status} onChange={(event) => setStatus(event.target.value)} className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100">
                  <option value="">Todo estado</option>
                  {statusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
                <div className="grid grid-cols-2 gap-3">
                  <select value={sortBy} onChange={(event) => setSortBy(event.target.value)} className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100">
                    <option value="updatedAt">Orden: Updated</option>
                    <option value="createdAt">Orden: Created</option>
                    <option value="completedAt">Orden: Completed</option>
                    <option value="title">Orden: Title</option>
                    <option value="difficulty">Orden: Difficulty</option>
                  </select>
                  <select value={sortOrder} onChange={(event) => setSortOrder(event.target.value)} className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100">
                    <option value="desc">Desc</option>
                    <option value="asc">Asc</option>
                  </select>
                </div>
              </div>
            </div>

            {error ? <p className="mt-4 text-sm text-rose-400">{error}</p> : null}
            {loading ? <p className="mt-4 text-sm text-slate-400">Actualizando vista...</p> : null}

            <div className="mt-5 overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="text-slate-400">
                  <tr className="border-b border-slate-800">
                    <th className="pb-3 pr-4 font-medium">Título</th>
                    <th className="pb-3 pr-4 font-medium">Plataforma</th>
                    <th className="pb-3 pr-4 font-medium">Categoría</th>
                    <th className="pb-3 pr-4 font-medium">Dificultad</th>
                    <th className="pb-3 pr-4 font-medium">Estado</th>
                    <th className="pb-3 pr-4 font-medium">Actualizado</th>
                    <th className="pb-3 font-medium">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {labs.map((lab) => (
                    <tr key={lab.id} className="border-b border-slate-900 text-slate-200 last:border-b-0">
                      <td className="py-3 pr-4">
                        <div className="font-medium text-slate-100">{lab.title}</div>
                        {lab.notes ? <div className="mt-1 max-w-xs truncate text-xs text-slate-400">{lab.notes}</div> : null}
                      </td>
                      <td className="py-3 pr-4">{enumLabel(lab.platform, platformOptions)}</td>
                      <td className="py-3 pr-4">{enumLabel(lab.category, categoryOptions)}</td>
                      <td className="py-3 pr-4">{enumLabel(lab.difficulty, difficultyOptions)}</td>
                      <td className="py-3 pr-4">
                        <span className={cn(
                          "rounded-full px-2 py-1 text-xs",
                          lab.status === RecordStatus.COMPLETED ? "bg-emerald-500/15 text-emerald-300" : "bg-slate-800 text-slate-300"
                        )}>
                          {enumLabel(lab.status, statusOptions)}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-slate-400">{new Date(lab.updatedAt).toLocaleDateString()}</td>
                      <td className="py-3">
                        <div className="flex gap-2">
                          <button type="button" onClick={() => populateForm(lab)} className="rounded-lg border border-slate-700 p-2 text-slate-300 transition hover:border-sky-400/50 hover:text-sky-200">
                            <PencilLine size={14} />
                          </button>
                          <button type="button" onClick={() => handleDelete(lab.id)} className="rounded-lg border border-slate-700 p-2 text-slate-300 transition hover:border-rose-400/50 hover:text-rose-300">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!labs.length ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">No hay laboratorios para los filtros actuales.</td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <aside className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-100">{editingId ? "Editar laboratorio" : "Nuevo laboratorio"}</h2>
              <p className="mt-1 text-sm text-slate-400">Alta, edición y actualización operativa.</p>
            </div>
            <button type="button" onClick={resetForm} className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-200 transition hover:border-sky-400/50">
              <Plus size={14} />
              Reiniciar
            </button>
          </div>

          <form onSubmit={submitForm} className="mt-5 space-y-4">
            <div>
              <label className="text-sm text-slate-300">Título</label>
              <input value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none ring-sky-400 focus:ring-2" required />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm text-slate-300">Plataforma</label>
                <select value={form.platform} onChange={(event) => setForm((current) => ({ ...current, platform: event.target.value as LabPlatform }))} className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100">
                  {platformOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm text-slate-300">Categoría</label>
                <select value={form.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value as LabCategory }))} className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100">
                  {categoryOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm text-slate-300">Dificultad</label>
                <select value={form.difficulty} onChange={(event) => setForm((current) => ({ ...current, difficulty: event.target.value as Difficulty }))} className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100">
                  {difficultyOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm text-slate-300">Estado</label>
                <select value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as RecordStatus }))} className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100">
                  {statusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="text-sm text-slate-300">Fecha de completado</label>
              <input type="datetime-local" value={form.completedAt} onChange={(event) => setForm((current) => ({ ...current, completedAt: event.target.value }))} className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100" />
            </div>
            <div>
              <label className="text-sm text-slate-300">Notas</label>
              <textarea value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} rows={6} className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none ring-sky-400 focus:ring-2" />
            </div>
            <button type="submit" className="w-full rounded-lg bg-sky-500 px-4 py-2 font-medium text-slate-950 transition hover:bg-sky-400">
              {editingId ? "Guardar cambios" : "Crear laboratorio"}
            </button>
          </form>
        </aside>
      </section>
    </div>
  );
}
