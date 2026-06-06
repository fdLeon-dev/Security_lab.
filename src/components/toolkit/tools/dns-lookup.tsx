"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

type DnsRecord = { name: string; type: number; TTL: number; data: string };

const TYPE_MAP: Record<number, string> = {
  1: "A", 2: "NS", 5: "CNAME", 6: "SOA",
  15: "MX", 16: "TXT", 28: "AAAA", 33: "SRV",
};

export function DnsLookup() {
  const [domain, setDomain] = useState("");
  const [records, setRecords] = useState<DnsRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setRecords([]);
    setLoading(true);
    try {
      const res = await fetch("/api/toolkit/dns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: domain.trim() }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Error en consulta DNS");
      setRecords(json.records ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          placeholder="example.com"
          className="flex-1 rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
        />
        <button
          type="submit"
          disabled={!domain.trim() || loading}
          className="flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-sm text-white hover:bg-sky-500 disabled:opacity-50"
        >
          <Search className="h-4 w-4" />
          {loading ? "Consultando…" : "Consultar"}
        </button>
      </form>

      {error && (
        <p className="rounded-lg bg-red-900/40 border border-red-700/40 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      )}

      {records.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-slate-800">
          <table className="w-full text-sm">
            <thead className="bg-slate-800/60">
              <tr>
                {["Nombre", "Tipo", "TTL", "Dato"].map((h) => (
                  <th key={h} className="px-4 py-2 text-left text-xs font-medium text-slate-400">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {records.map((r, i) => (
                <tr key={i} className={cn(i % 2 === 0 ? "bg-slate-900/40" : "bg-slate-900/20")}>
                  <td className="px-4 py-2 text-slate-300 font-mono text-xs">{r.name}</td>
                  <td className="px-4 py-2">
                    <span className="rounded bg-sky-900/50 px-2 py-0.5 text-xs text-sky-300">
                      {TYPE_MAP[r.type] ?? r.type}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-slate-400 font-mono text-xs">{r.TTL}</td>
                  <td className="px-4 py-2 text-slate-300 font-mono text-xs break-all">{r.data}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && records.length === 0 && !error && domain && (
        <p className="text-sm text-slate-500">Sin registros encontrados.</p>
      )}
    </div>
  );
}
