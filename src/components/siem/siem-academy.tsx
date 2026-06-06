"use client";

import {
  SiemAlertStatus,
  SiemEventCategory,
} from "@prisma/client";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { AlertTriangle, Clock3, ListFilter, Plus, ShieldCheck } from "lucide-react";
import { MetricCard } from "@/components/dashboard/metric-card";

type SiemEvent = {
  id: string;
  source: string;
  category: SiemEventCategory;
  severity: number;
  timestamp: string;
  description: string;
  alerts: Array<{ id: string; title: string; status: SiemAlertStatus }>;
};

type SiemRule = {
  id: string;
  name: string;
  condition: string;
  severity: number;
  enabled: boolean;
};

type SiemAlert = {
  id: string;
  title: string;
  severity: number;
  status: SiemAlertStatus;
  event: { id: string; source: string; category: SiemEventCategory; timestamp: string };
  rule: { id: string; name: string } | null;
};

type Paginated<T> = {
  entries: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

type DashboardPayload = {
  events: Array<{
    id: string;
    source: string;
    category: SiemEventCategory;
    severity: number;
    timestamp: string;
    description: string;
  }>;
  openAlerts: number;
  closedAlerts: number;
  rules: number;
  eventCount: number;
  alertCount: number;
  trends: Array<{ severity: number; count: number }>;
  timeline: Array<{
    id: string;
    title: string;
    severity: number;
    status: SiemAlertStatus;
    createdAt: string;
  }>;
};

type EventForm = {
  source: string;
  category: SiemEventCategory;
  severity: number;
  timestamp: string;
  description: string;
};

type RuleForm = {
  name: string;
  condition: string;
  severity: number;
  enabled: boolean;
};

type AlertForm = {
  title: string;
  severity: number;
  status: SiemAlertStatus;
  eventId: string;
  ruleId: string;
};

const EVENT_CATEGORIES = [
  { value: SiemEventCategory.AUTHENTICATION, label: "Authentication" },
  { value: SiemEventCategory.NETWORK, label: "Network" },
  { value: SiemEventCategory.SYSTEM, label: "System" },
  { value: SiemEventCategory.APPLICATION, label: "Application" },
  { value: SiemEventCategory.ENDPOINT, label: "Endpoint" },
  { value: SiemEventCategory.AUDIT, label: "Audit" },
];

const ALERT_STATUSES = [
  { value: SiemAlertStatus.OPEN, label: "Open" },
  { value: SiemAlertStatus.ACKNOWLEDGED, label: "Acknowledged" },
  { value: SiemAlertStatus.CLOSED, label: "Closed" },
];

const EMPTY_EVENT: EventForm = {
  source: "",
  category: SiemEventCategory.SYSTEM,
  severity: 4,
  timestamp: new Date().toISOString().slice(0, 16),
  description: "",
};

const EMPTY_RULE: RuleForm = {
  name: "",
  condition: "",
  severity: 4,
  enabled: true,
};

const EMPTY_ALERT: AlertForm = {
  title: "",
  severity: 4,
  status: SiemAlertStatus.OPEN,
  eventId: "",
  ruleId: "",
};

async function parseResponse<T>(response: Response): Promise<T> {
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(body?.error ?? "Request failed");
  }
  return body as T;
}

function severityTone(severity: number) {
  if (severity >= 8) return "bg-rose-500/15 text-rose-300 border-rose-500/30";
  if (severity >= 5) return "bg-amber-500/15 text-amber-200 border-amber-500/30";
  return "bg-emerald-500/15 text-emerald-300 border-emerald-500/30";
}

function statusTone(status: SiemAlertStatus) {
  switch (status) {
    case SiemAlertStatus.OPEN:
      return "bg-rose-500/15 text-rose-300 border-rose-500/30";
    case SiemAlertStatus.ACKNOWLEDGED:
      return "bg-amber-500/15 text-amber-200 border-amber-500/30";
    case SiemAlertStatus.CLOSED:
      return "bg-emerald-500/15 text-emerald-300 border-emerald-500/30";
  }
}

function Pagination({ page, totalPages, onChange }: { page: number; totalPages: number; onChange: (page: number) => void }) {
  return (
    <div className="flex items-center justify-end gap-2 text-sm text-slate-300">
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
        className="rounded-md border border-slate-700 px-3 py-1 disabled:opacity-50"
      >
        Prev
      </button>
      <span>
        Page {page} / {Math.max(1, totalPages)}
      </span>
      <button
        type="button"
        disabled={page >= totalPages}
        onClick={() => onChange(page + 1)}
        className="rounded-md border border-slate-700 px-3 py-1 disabled:opacity-50"
      >
        Next
      </button>
    </div>
  );
}

export function SiemAcademy() {
  const [dashboard, setDashboard] = useState<DashboardPayload>({
    events: [],
    openAlerts: 0,
    closedAlerts: 0,
    rules: 0,
    eventCount: 0,
    alertCount: 0,
    trends: [],
    timeline: [],
  });
  const [events, setEvents] = useState<Paginated<SiemEvent>>({ entries: [], total: 0, page: 1, pageSize: 8, totalPages: 1 });
  const [rules, setRules] = useState<Paginated<SiemRule>>({ entries: [], total: 0, page: 1, pageSize: 8, totalPages: 1 });
  const [alerts, setAlerts] = useState<Paginated<SiemAlert>>({ entries: [], total: 0, page: 1, pageSize: 8, totalPages: 1 });
  const [error, setError] = useState("");
  const [isLoading, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<"overview" | "events" | "rules" | "alerts">("overview");

  const [eventSearch, setEventSearch] = useState("");
  const [eventCategory, setEventCategory] = useState("");
  const [eventPage, setEventPage] = useState(1);
  const [eventForm, setEventForm] = useState<EventForm>(EMPTY_EVENT);
  const [eventEditingId, setEventEditingId] = useState<string | null>(null);

  const [ruleSearch, setRuleSearch] = useState("");
  const [rulePage, setRulePage] = useState(1);
  const [ruleForm, setRuleForm] = useState<RuleForm>(EMPTY_RULE);
  const [ruleEditingId, setRuleEditingId] = useState<string | null>(null);

  const [alertSearch, setAlertSearch] = useState("");
  const [alertStatus, setAlertStatus] = useState("");
  const [alertPage, setAlertPage] = useState(1);
  const [alertForm, setAlertForm] = useState<AlertForm>(EMPTY_ALERT);
  const [alertEditingId, setAlertEditingId] = useState<string | null>(null);

  const eventQuery = useMemo(() => {
    const params = new URLSearchParams();
    if (eventSearch) params.set("search", eventSearch);
    if (eventCategory) params.set("category", eventCategory);
    params.set("page", String(eventPage));
    params.set("pageSize", "8");
    params.set("sortBy", "timestamp");
    params.set("sortOrder", "desc");
    return params.toString();
  }, [eventCategory, eventPage, eventSearch]);

  const ruleQuery = useMemo(() => {
    const params = new URLSearchParams();
    if (ruleSearch) params.set("search", ruleSearch);
    params.set("page", String(rulePage));
    params.set("pageSize", "8");
    params.set("sortBy", "updatedAt");
    params.set("sortOrder", "desc");
    return params.toString();
  }, [rulePage, ruleSearch]);

  const alertQuery = useMemo(() => {
    const params = new URLSearchParams();
    if (alertSearch) params.set("search", alertSearch);
    if (alertStatus) params.set("status", alertStatus);
    params.set("page", String(alertPage));
    params.set("pageSize", "8");
    params.set("sortBy", "createdAt");
    params.set("sortOrder", "desc");
    return params.toString();
  }, [alertPage, alertSearch, alertStatus]);

  const loadDashboard = useCallback(async () => {
    const data = await parseResponse<DashboardPayload>(await fetch("/api/siem/dashboard", { cache: "no-store" }));
    setDashboard(data);
  }, []);

  const loadEvents = useCallback(async () => {
    const data = await parseResponse<Paginated<SiemEvent>>(await fetch(`/api/siem/events?${eventQuery}`, { cache: "no-store" }));
    setEvents(data);
  }, [eventQuery]);

  const loadRules = useCallback(async () => {
    const data = await parseResponse<Paginated<SiemRule>>(await fetch(`/api/siem/rules?${ruleQuery}`, { cache: "no-store" }));
    setRules(data);
  }, [ruleQuery]);

  const loadAlerts = useCallback(async () => {
    const data = await parseResponse<Paginated<SiemAlert>>(await fetch(`/api/siem/alerts?${alertQuery}`, { cache: "no-store" }));
    setAlerts(data);
  }, [alertQuery]);

  const refresh = useCallback(async () => {
    await Promise.all([loadDashboard(), loadEvents(), loadRules(), loadAlerts()]);
  }, [loadAlerts, loadDashboard, loadEvents, loadRules]);

  useEffect(() => {
    startTransition(() => {
      void refresh().catch((requestError) => {
        setError(requestError instanceof Error ? requestError.message : "Unable to load SIEM data");
      });
    });
  }, [refresh, startTransition]);

  async function handleDelete(path: string) {
    await parseResponse(await fetch(path, { method: "DELETE" }));
    await refresh();
  }

  async function submitEvent(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    try {
      const response = await fetch(eventEditingId ? `/api/siem/events/${eventEditingId}` : "/api/siem/events", {
        method: eventEditingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...eventForm,
          timestamp: new Date(eventForm.timestamp).toISOString(),
        }),
      });
      await parseResponse(response);
      setEventEditingId(null);
      setEventForm({ ...EMPTY_EVENT, timestamp: new Date().toISOString().slice(0, 16) });
      await refresh();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to save event");
    }
  }

  async function submitRule(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    try {
      const response = await fetch(ruleEditingId ? `/api/siem/rules/${ruleEditingId}` : "/api/siem/rules", {
        method: ruleEditingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ruleForm),
      });
      await parseResponse(response);
      setRuleEditingId(null);
      setRuleForm(EMPTY_RULE);
      await refresh();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to save rule");
    }
  }

  async function submitAlert(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    try {
      const response = await fetch(alertEditingId ? `/api/siem/alerts/${alertEditingId}` : "/api/siem/alerts", {
        method: alertEditingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...alertForm,
          ruleId: alertForm.ruleId || null,
        }),
      });
      await parseResponse(response);
      setAlertEditingId(null);
      setAlertForm(EMPTY_ALERT);
      await refresh();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to save alert");
    }
  }

  return (
    <div className="mt-6 space-y-6">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Eventos" value={dashboard.eventCount} helper="Historial académico" />
        <MetricCard label="Alertas abiertas" value={dashboard.openAlerts} helper="Revisión pendiente" />
        <MetricCard label="Alertas cerradas" value={dashboard.closedAlerts} helper="Resueltas" />
        <MetricCard label="Reglas activas" value={dashboard.rules} helper="Filtros habilitados" />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <article className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
          <div className="flex items-center gap-2 text-slate-100">
            <Clock3 size={18} className="text-cyan-300" />
            <h2 className="text-lg font-semibold">Timeline de alertas académicas</h2>
          </div>
          <div className="mt-5 space-y-4">
            {dashboard.timeline.map((item) => (
              <div key={item.id} className="border-l border-sky-400/40 pl-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-slate-100">{item.title}</p>
                  <span className={`rounded-full border px-2 py-1 text-[11px] ${statusTone(item.status)}`}>{item.status}</span>
                </div>
                <div className="mt-1 flex items-center gap-2 text-xs text-slate-400">
                  <ShieldCheck size={12} />
                  {new Date(item.createdAt).toLocaleString()}
                </div>
                <div className={`mt-2 inline-flex rounded-full border px-2 py-1 text-[11px] ${severityTone(item.severity)}`}>
                  Severity {item.severity}
                </div>
              </div>
            ))}
            {!dashboard.timeline.length ? <p className="text-sm text-slate-400">No hay alertas generadas aún.</p> : null}
          </div>
        </article>

        <article className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
          <h2 className="text-lg font-semibold text-slate-100">Tendencias</h2>
          <div className="mt-4 space-y-3">
            {dashboard.trends.map((item) => (
              <div key={item.severity}>
                <div className="mb-1 flex items-center justify-between text-sm text-slate-300">
                  <span>Severity {item.severity}</span>
                  <span>{item.count}</span>
                </div>
                <div className="h-2 rounded-full bg-slate-800">
                  <div className="h-full rounded-full bg-cyan-400" style={{ width: `${Math.min(item.count * 12, 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <MetricCard label="Fuente eventos" value={dashboard.events.length} helper="Recientes" />
            <MetricCard label="Alertas totales" value={dashboard.alertCount} helper="Histórico" />
          </div>
        </article>
      </section>

      <div className="flex flex-wrap items-center gap-2">
        {[
          { key: "overview", label: "Overview" },
          { key: "events", label: "Events" },
          { key: "rules", label: "Rules" },
          { key: "alerts", label: "Alerts" },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key as typeof activeTab)}
            className={`rounded-lg border px-3 py-2 text-sm ${activeTab === tab.key ? "border-sky-400/60 bg-sky-500/10 text-sky-200" : "border-slate-700 text-slate-300"}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error ? <p className="text-sm text-rose-400">{error}</p> : null}
      {isLoading ? <p className="text-sm text-slate-400">Cargando SIEM academico...</p> : null}

      {activeTab === "overview" ? (
        <section className="grid gap-4 xl:grid-cols-3">
          <article className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 xl:col-span-2">
            <div className="flex items-center gap-2 text-slate-100">
              <ListFilter size={18} className="text-sky-300" />
              <h2 className="text-lg font-semibold">Eventos recientes</h2>
            </div>
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-slate-800 text-slate-400">
                  <tr>
                    <th className="pb-2 pr-4">Fuente</th>
                    <th className="pb-2 pr-4">Categoría</th>
                    <th className="pb-2 pr-4">Severidad</th>
                    <th className="pb-2 pr-4">Timestamp</th>
                    <th className="pb-2">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboard.events.map((item) => (
                    <tr key={item.id} className="border-b border-slate-900 text-slate-200">
                      <td className="py-2 pr-4">{item.source}</td>
                      <td className="py-2 pr-4">{item.category}</td>
                      <td className="py-2 pr-4">{item.severity}</td>
                      <td className="py-2 pr-4">{new Date(item.timestamp).toLocaleString()}</td>
                      <td className="py-2">{item.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>
          <article className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
            <h2 className="text-lg font-semibold text-slate-100">Objetivo educativo</h2>
            <p className="mt-2 text-sm text-slate-400">
              El módulo simula la operación conceptual de un SIEM para aprender a registrar, clasificar y revisar eventos sin consumir fuentes reales ni generar detección ofensiva.
            </p>
            <div className="mt-4 space-y-3 text-sm text-slate-300">
              <p>Eventos por severidad.</p>
              <p>Alertas abiertas y cerradas.</p>
              <p>Reglas académicas de correlación.</p>
              <p>Vista cronológica tipo timeline.</p>
            </div>
          </article>
        </section>
      ) : null}

      {activeTab === "events" ? (
        <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
          <article className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-100">Eventos</h2>
                <p className="mt-1 text-sm text-slate-400">Búsqueda, clasificación y mantenimiento académico.</p>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <input value={eventSearch} onChange={(event) => { setEventPage(1); setEventSearch(event.target.value); }} placeholder="Buscar fuente o descripción" className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100" />
                <select value={eventCategory} onChange={(event) => { setEventPage(1); setEventCategory(event.target.value); }} className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100">
                  <option value="">Todas las categorías</option>
                  {EVENT_CATEGORIES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                </select>
              </div>
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-slate-800 text-slate-400">
                  <tr>
                    <th className="pb-2 pr-4">Source</th>
                    <th className="pb-2 pr-4">Category</th>
                    <th className="pb-2 pr-4">Severity</th>
                    <th className="pb-2 pr-4">Timestamp</th>
                    <th className="pb-2 pr-4">Alerts</th>
                    <th className="pb-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {events.entries.map((item) => (
                    <tr key={item.id} className="border-b border-slate-900 text-slate-200">
                      <td className="py-2 pr-4">{item.source}</td>
                      <td className="py-2 pr-4">{item.category}</td>
                      <td className="py-2 pr-4"><span className={`rounded-full border px-2 py-1 text-[11px] ${severityTone(item.severity)}`}>S{item.severity}</span></td>
                      <td className="py-2 pr-4">{new Date(item.timestamp).toLocaleString()}</td>
                      <td className="py-2 pr-4">{item.alerts.length}</td>
                      <td className="py-2">
                        <button type="button" className="mr-2 rounded border border-slate-700 px-2 py-1 text-xs" onClick={() => { setEventEditingId(item.id); setEventForm({ source: item.source, category: item.category, severity: item.severity, timestamp: new Date(item.timestamp).toISOString().slice(0, 16), description: item.description }); }}>
                          Edit
                        </button>
                        <button type="button" className="rounded border border-rose-500/40 px-2 py-1 text-xs text-rose-300" onClick={() => void handleDelete(`/api/siem/events/${item.id}`)}>
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={events.page} totalPages={events.totalPages} onChange={setEventPage} />
          </article>

          <form onSubmit={submitEvent} className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5 space-y-3">
            <div className="flex items-center gap-2 text-slate-100">
              <Plus size={16} />
              <h3 className="text-base font-semibold">{eventEditingId ? "Editar evento" : "Nuevo evento"}</h3>
            </div>
            <input value={eventForm.source} onChange={(event) => setEventForm((current) => ({ ...current, source: event.target.value }))} placeholder="Source" className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100" required />
            <select value={eventForm.category} onChange={(event) => setEventForm((current) => ({ ...current, category: event.target.value as SiemEventCategory }))} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100">
              {EVENT_CATEGORIES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
            <input type="number" min={1} max={10} value={eventForm.severity} onChange={(event) => setEventForm((current) => ({ ...current, severity: Number(event.target.value) }))} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100" />
            <input type="datetime-local" value={eventForm.timestamp} onChange={(event) => setEventForm((current) => ({ ...current, timestamp: event.target.value }))} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100" />
            <textarea value={eventForm.description} onChange={(event) => setEventForm((current) => ({ ...current, description: event.target.value }))} rows={6} placeholder="Academic description" className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100" />
            <button type="submit" className="w-full rounded-lg bg-sky-500 px-4 py-2 text-sm font-semibold text-slate-950">Guardar evento</button>
          </form>
        </section>
      ) : null}

      {activeTab === "rules" ? (
        <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
          <article className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-100">Rules</h2>
                <p className="mt-1 text-sm text-slate-400">Reglas académicas para aprendizaje conceptual.</p>
              </div>
              <input value={ruleSearch} onChange={(event) => { setRulePage(1); setRuleSearch(event.target.value); }} placeholder="Buscar reglas" className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100" />
            </div>
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-slate-800 text-slate-400">
                  <tr>
                    <th className="pb-2 pr-4">Name</th>
                    <th className="pb-2 pr-4">Condition</th>
                    <th className="pb-2 pr-4">Severity</th>
                    <th className="pb-2 pr-4">Enabled</th>
                    <th className="pb-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rules.entries.map((item) => (
                    <tr key={item.id} className="border-b border-slate-900 text-slate-200">
                      <td className="py-2 pr-4">{item.name}</td>
                      <td className="py-2 pr-4">{item.condition}</td>
                      <td className="py-2 pr-4">{item.severity}</td>
                      <td className="py-2 pr-4">{item.enabled ? "Yes" : "No"}</td>
                      <td className="py-2">
                        <button type="button" className="mr-2 rounded border border-slate-700 px-2 py-1 text-xs" onClick={() => { setRuleEditingId(item.id); setRuleForm({ name: item.name, condition: item.condition, severity: item.severity, enabled: item.enabled }); }}>
                          Edit
                        </button>
                        <button type="button" className="rounded border border-rose-500/40 px-2 py-1 text-xs text-rose-300" onClick={() => void handleDelete(`/api/siem/rules/${item.id}`)}>
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={rules.page} totalPages={rules.totalPages} onChange={setRulePage} />
          </article>

          <form onSubmit={submitRule} className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5 space-y-3">
            <div className="flex items-center gap-2 text-slate-100">
              <Plus size={16} />
              <h3 className="text-base font-semibold">{ruleEditingId ? "Editar regla" : "Nueva regla"}</h3>
            </div>
            <input value={ruleForm.name} onChange={(event) => setRuleForm((current) => ({ ...current, name: event.target.value }))} placeholder="Name" className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100" required />
            <textarea value={ruleForm.condition} onChange={(event) => setRuleForm((current) => ({ ...current, condition: event.target.value }))} rows={5} placeholder="Condition" className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100" />
            <input type="number" min={1} max={10} value={ruleForm.severity} onChange={(event) => setRuleForm((current) => ({ ...current, severity: Number(event.target.value) }))} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100" />
            <label className="flex items-center gap-2 text-sm text-slate-300">
              <input type="checkbox" checked={ruleForm.enabled} onChange={(event) => setRuleForm((current) => ({ ...current, enabled: event.target.checked }))} />
              Enabled
            </label>
            <button type="submit" className="w-full rounded-lg bg-sky-500 px-4 py-2 text-sm font-semibold text-slate-950">Guardar regla</button>
          </form>
        </section>
      ) : null}

      {activeTab === "alerts" ? (
        <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
          <article className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-100">Alerts</h2>
                <p className="mt-1 text-sm text-slate-400">Alertas académicas generadas para aprendizaje.</p>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <input value={alertSearch} onChange={(event) => { setAlertPage(1); setAlertSearch(event.target.value); }} placeholder="Buscar alertas" className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100" />
                <select value={alertStatus} onChange={(event) => { setAlertPage(1); setAlertStatus(event.target.value); }} className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100">
                  <option value="">All statuses</option>
                  {ALERT_STATUSES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                </select>
              </div>
            </div>
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-slate-800 text-slate-400">
                  <tr>
                    <th className="pb-2 pr-4">Title</th>
                    <th className="pb-2 pr-4">Severity</th>
                    <th className="pb-2 pr-4">Status</th>
                    <th className="pb-2 pr-4">Event</th>
                    <th className="pb-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {alerts.entries.map((item) => (
                    <tr key={item.id} className="border-b border-slate-900 text-slate-200">
                      <td className="py-2 pr-4">{item.title}</td>
                      <td className="py-2 pr-4">{item.severity}</td>
                      <td className="py-2 pr-4"><span className={`rounded-full border px-2 py-1 text-[11px] ${statusTone(item.status)}`}>{item.status}</span></td>
                      <td className="py-2 pr-4">{item.event.source}</td>
                      <td className="py-2">
                        <button type="button" className="mr-2 rounded border border-slate-700 px-2 py-1 text-xs" onClick={() => { setAlertEditingId(item.id); setAlertForm({ title: item.title, severity: item.severity, status: item.status, eventId: item.event.id, ruleId: item.rule?.id ?? "" }); }}>
                          Edit
                        </button>
                        <button type="button" className="rounded border border-rose-500/40 px-2 py-1 text-xs text-rose-300" onClick={() => void handleDelete(`/api/siem/alerts/${item.id}`)}>
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={alerts.page} totalPages={alerts.totalPages} onChange={setAlertPage} />
          </article>

          <form onSubmit={submitAlert} className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5 space-y-3">
            <div className="flex items-center gap-2 text-slate-100">
              <AlertTriangle size={16} />
              <h3 className="text-base font-semibold">{alertEditingId ? "Editar alerta" : "Nueva alerta"}</h3>
            </div>
            <input value={alertForm.title} onChange={(event) => setAlertForm((current) => ({ ...current, title: event.target.value }))} placeholder="Title" className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100" required />
            <input type="number" min={1} max={10} value={alertForm.severity} onChange={(event) => setAlertForm((current) => ({ ...current, severity: Number(event.target.value) }))} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100" />
            <select value={alertForm.status} onChange={(event) => setAlertForm((current) => ({ ...current, status: event.target.value as SiemAlertStatus }))} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100">
              {ALERT_STATUSES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
            <select value={alertForm.eventId} onChange={(event) => setAlertForm((current) => ({ ...current, eventId: event.target.value }))} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100" required>
              <option value="">Select event</option>
              {events.entries.map((item) => <option key={item.id} value={item.id}>{item.source} - {item.category}</option>)}
            </select>
            <select value={alertForm.ruleId} onChange={(event) => setAlertForm((current) => ({ ...current, ruleId: event.target.value }))} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100">
              <option value="">No rule</option>
              {rules.entries.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
            <button type="submit" className="w-full rounded-lg bg-sky-500 px-4 py-2 text-sm font-semibold text-slate-950">Guardar alerta</button>
          </form>
        </section>
      ) : null}
    </div>
  );
}
