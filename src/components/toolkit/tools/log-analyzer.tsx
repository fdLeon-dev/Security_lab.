"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

type LogEntry = { line: number; raw: string; level: string };
type Stats = { total: number; byLevel: Record<string, number> };

const LEVEL_COLORS: Record<string, string> = {
  ERROR: "bg-red-900/50 text-red-300",
  WARN: "bg-yellow-900/50 text-yellow-300",
  INFO: "bg-sky-900/50 text-sky-300",
  DEBUG: "bg-slate-700/60 text-slate-400",
};

export function LogAnalyzer() {
  const [content, setContent] = useState("");
  const [search, setSearch] = useState("");
  const [minLevel, setMinLevel] = useState<"ALL" | "INFO" | "WARN" | "ERROR" | "DEBUG">("ALL");
  const [lines, setLines] = useState<LogEntry[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAnalyze(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/toolkit/logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, search: search || undefined, minLevel }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Error analizando logs");
      setLines(json.lines ?? []);
      setStats(json.stats ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setContent((ev.target?.result as string) ?? "");
    reader.readAsText(file);
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleAnalyze} className="space-y-3">
        <div className="flex items-center gap-2">
          <label className="cursor-pointer rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-slate-300 hover:border-sky-600">
            Cargar archivo
            <input type="file" accept=".log,.txt" onChange={handleFile} className="hidden" />
          </label>
          {content && (
            <span className="text-xs text-slate-500">
              {content.split("\n").length} líneas cargadas
            </span>
          )}
        </div>

        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Pega el contenido del log aquí…"
          rows={5}
          className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-xs font-mono text-slate-300 focus:outline-none focus:ring-1 focus:ring-sky-500 resize-y"
        />

        <div className="flex gap-2 flex-wrap">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar patrón…"
            className="flex-1 min-w-[160px] rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
          />
          <select
            value={minLevel}
            onChange={(e) =>
              setMinLevel(e.target.value as typeof minLevel)
            }
            className="rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-slate-300 focus:outline-none focus:ring-1 focus:ring-sky-500"
          >
            <option value="ALL">Todos los niveles</option>
            <option value="DEBUG">DEBUG+</option>
            <option value="INFO">INFO+</option>
            <option value="WARN">WARN+</option>
            <option value="ERROR">Solo ERROR</option>
          </select>
          <button
            type="submit"
            disabled={!content.trim() || loading}
            className="rounded-lg bg-sky-600 px-4 py-2 text-sm text-white hover:bg-sky-500 disabled:opacity-50"
          >
            {loading ? "Analizando…" : "Analizar"}
          </button>
        </div>
      </form>

      {error && (
        <p className="rounded-lg bg-red-900/40 border border-red-700/40 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      )}

      {stats && (
        <div className="flex gap-3 flex-wrap">
          <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300">
            Total: {stats.total}
          </span>
          {Object.entries(stats.byLevel).map(([level, count]) => (
            <span
              key={level}
              className={cn("rounded-full px-3 py-1 text-xs", LEVEL_COLORS[level] ?? "")}
            >
              {level}: {count}
            </span>
          ))}
        </div>
      )}

      {lines.length > 0 && (
        <div className="overflow-y-auto max-h-64 rounded-lg border border-slate-800">
          {lines.map((entry) => (
            <div
              key={entry.line}
              className="flex gap-2 border-b border-slate-800/60 px-3 py-1 hover:bg-slate-800/40"
            >
              <span className="text-xs text-slate-600 w-10 shrink-0 pt-0.5">{entry.line}</span>
              <span
                className={cn(
                  "shrink-0 self-start rounded px-1.5 py-0.5 text-[10px] font-medium uppercase",
                  LEVEL_COLORS[entry.level] ?? "bg-slate-700/60 text-slate-400"
                )}
              >
                {entry.level}
              </span>
              <span className="font-mono text-xs text-slate-300 break-all">{entry.raw}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
