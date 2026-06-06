"use client";

import { useEffect, useState } from "react";
import { BarChart3, Clock } from "lucide-react";

type HistoryEntry = {
  id: string;
  toolName: string;
  input: string;
  createdAt: string;
};

type Stat = { tool: string; count: number };

const TOOL_LABELS: Record<string, string> = {
  dns_lookup:      "DNS Lookup",
  ssl_checker:     "SSL Checker",
  log_analyzer:    "Log Analyzer",
  hash_utilities:  "Hash Utilities",
  json_formatter:  "JSON Formatter",
  base64:          "Base64",
  password_policy: "Password Policy",
};

export function ToolkitHistory() {
  const [recent, setRecent] = useState<HistoryEntry[]>([]);
  const [stats, setStats] = useState<Stat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [histRes, dashRes] = await Promise.all([
          fetch("/api/toolkit/history"),
          fetch("/api/toolkit/dashboard"),
        ]);
        if (histRes.ok) setRecent(await histRes.json());
        if (dashRes.ok) {
          const d = await dashRes.json();
          setStats(d.stats ?? []);
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return <p className="text-sm text-slate-500">Cargando historial…</p>;
  }

  const maxCount = stats.reduce((m, s) => Math.max(m, s.count), 0);

  return (
    <div className="space-y-6">
      {stats.length > 0 && (
        <section className="space-y-2">
          <h3 className="flex items-center gap-2 text-sm font-medium text-slate-300">
            <BarChart3 className="h-4 w-4 text-sky-400" />
            Uso por herramienta
          </h3>
          <div className="space-y-1.5">
            {stats.map((s) => (
              <div key={s.tool} className="flex items-center gap-3">
                <span className="w-36 shrink-0 text-xs text-slate-400">
                  {TOOL_LABELS[s.tool] ?? s.tool}
                </span>
                <div className="flex-1 h-3 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-3 rounded-full bg-sky-600 transition-all"
                    style={{ width: `${maxCount > 0 ? (s.count / maxCount) * 100 : 0}%` }}
                  />
                </div>
                <span className="w-8 text-right text-xs text-slate-400">{s.count}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="space-y-2">
        <h3 className="flex items-center gap-2 text-sm font-medium text-slate-300">
          <Clock className="h-4 w-4 text-sky-400" />
          Actividad reciente
        </h3>
        {recent.length === 0 ? (
          <p className="text-sm text-slate-500">Sin actividad registrada aún.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-slate-800">
            <table className="w-full text-sm">
              <thead className="bg-slate-800/60">
                <tr>
                  {["Herramienta", "Entrada", "Fecha"].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-2 text-left text-xs font-medium text-slate-400"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {recent.map((entry) => (
                  <tr key={entry.id} className="hover:bg-slate-800/30">
                    <td className="px-4 py-2">
                      <span className="rounded bg-sky-900/50 px-2 py-0.5 text-xs text-sky-300">
                        {TOOL_LABELS[entry.toolName] ?? entry.toolName}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-xs text-slate-400 max-w-xs truncate">
                      {entry.input}
                    </td>
                    <td className="px-4 py-2 text-xs text-slate-500 whitespace-nowrap">
                      {new Date(entry.createdAt).toLocaleString("es-ES", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
