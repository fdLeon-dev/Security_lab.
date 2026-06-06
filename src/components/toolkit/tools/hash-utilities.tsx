"use client";

import { useState } from "react";
import { Hash, Copy, Check } from "lucide-react";

type Hashes = Record<string, string>;

export function HashUtilities() {
  const [input, setInput] = useState("");
  const [algorithms, setAlgorithms] = useState<string[]>(["sha256", "sha512"]);
  const [hashes, setHashes] = useState<Hashes>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setHashes({});
    setLoading(true);
    try {
      const res = await fetch("/api/toolkit/hash", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input, algorithms }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Error calculando hash");
      setHashes(json.hashes ?? {});
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  }

  function toggleAlgo(algo: string) {
    setAlgorithms((prev) =>
      prev.includes(algo) ? prev.filter((a) => a !== algo) : [...prev, algo]
    );
  }

  async function copyToClipboard(hash: string, key: string) {
    await navigator.clipboard.writeText(hash);
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-3">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Introduce el texto a hashear…"
          rows={4}
          className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm font-mono text-slate-300 focus:outline-none focus:ring-1 focus:ring-sky-500 resize-y"
        />
        <div className="flex items-center gap-4 flex-wrap">
          <span className="text-xs text-slate-400">Algoritmos:</span>
          {["sha256", "sha512", "md5"].map((algo) => (
            <label key={algo} className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={algorithms.includes(algo)}
                onChange={() => toggleAlgo(algo)}
                className="accent-sky-500"
              />
              <span className="text-sm text-slate-300 uppercase">{algo}</span>
            </label>
          ))}
          <button
            type="submit"
            disabled={!input.trim() || algorithms.length === 0 || loading}
            className="ml-auto flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-sm text-white hover:bg-sky-500 disabled:opacity-50"
          >
            <Hash className="h-4 w-4" />
            {loading ? "Calculando…" : "Calcular"}
          </button>
        </div>
      </form>

      {error && (
        <p className="rounded-lg bg-red-900/40 border border-red-700/40 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      )}

      {Object.entries(hashes).length > 0 && (
        <div className="space-y-2">
          {Object.entries(hashes).map(([algo, hash]) => (
            <div
              key={algo}
              className="rounded-lg border border-slate-800 bg-slate-900/40 p-3 space-y-1"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-sky-400 uppercase">{algo}</span>
                <button
                  onClick={() => copyToClipboard(hash, algo)}
                  className="flex items-center gap-1 rounded px-2 py-1 text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                >
                  {copied === algo ? (
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                  Copiar
                </button>
              </div>
              <code className="block break-all text-xs font-mono text-slate-300">{hash}</code>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
