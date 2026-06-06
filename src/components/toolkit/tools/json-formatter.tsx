"use client";

import { useState } from "react";
import { Braces, Copy, Check } from "lucide-react";

export function JsonFormatter() {
  const [input, setInput] = useState("");
  const [indent, setIndent] = useState(2);
  const [formatted, setFormatted] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setFormatted(null);
    setLoading(true);
    try {
      const res = await fetch("/api/toolkit/json", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input, indent }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "JSON inválido");
      setFormatted(json.formatted ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  }

  async function copyToClipboard() {
    if (!formatted) return;
    await navigator.clipboard.writeText(formatted);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-3">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder='{"key": "value"}'
          rows={6}
          className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-xs font-mono text-slate-300 focus:outline-none focus:ring-1 focus:ring-sky-500 resize-y"
        />
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-slate-400">
            Sangría:
            <select
              value={indent}
              onChange={(e) => setIndent(Number(e.target.value))}
              className="rounded bg-slate-800 border border-slate-700 px-2 py-1 text-sm text-slate-300 focus:outline-none focus:ring-1 focus:ring-sky-500"
            >
              {[2, 4].map((n) => (
                <option key={n} value={n}>
                  {n} espacios
                </option>
              ))}
            </select>
          </label>
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="ml-auto flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-sm text-white hover:bg-sky-500 disabled:opacity-50"
          >
            <Braces className="h-4 w-4" />
            {loading ? "Formateando…" : "Formatear"}
          </button>
        </div>
      </form>

      {error && (
        <p className="rounded-lg bg-red-900/40 border border-red-700/40 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      )}

      {formatted && (
        <div className="relative">
          <button
            onClick={copyToClipboard}
            className="absolute right-2 top-2 flex items-center gap-1 rounded px-2 py-1 text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-700"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            Copiar
          </button>
          <pre className="overflow-auto max-h-64 rounded-lg border border-slate-800 bg-slate-900/40 p-4 text-xs font-mono text-slate-300">
            {formatted}
          </pre>
        </div>
      )}
    </div>
  );
}
