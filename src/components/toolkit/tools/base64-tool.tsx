"use client";

import { useState } from "react";
import { RefreshCw, Copy, Check } from "lucide-react";

export function Base64Tool() {
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<"encode" | "decode">("encode");
  const [output, setOutput] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setOutput(null);
    setLoading(true);
    try {
      const res = await fetch("/api/toolkit/base64", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input, mode }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Error en conversión Base64");
      setOutput(json.output ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  }

  async function copyToClipboard() {
    if (!output) return;
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function swapInputOutput() {
    if (output) {
      setInput(output);
      setOutput(null);
      setMode((prev) => (prev === "encode" ? "decode" : "encode"));
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-3">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={mode === "encode" ? "Texto a codificar…" : "Base64 a decodificar…"}
          rows={4}
          className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm font-mono text-slate-300 focus:outline-none focus:ring-1 focus:ring-sky-500 resize-y"
        />
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex rounded-lg overflow-hidden border border-slate-700">
            {(["encode", "decode"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={`px-4 py-2 text-sm transition-colors ${
                  mode === m
                    ? "bg-sky-700 text-white"
                    : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                }`}
              >
                {m === "encode" ? "Codificar" : "Decodificar"}
              </button>
            ))}
          </div>
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="ml-auto rounded-lg bg-sky-600 px-4 py-2 text-sm text-white hover:bg-sky-500 disabled:opacity-50"
          >
            {loading ? "Procesando…" : "Convertir"}
          </button>
        </div>
      </form>

      {error && (
        <p className="rounded-lg bg-red-900/40 border border-red-700/40 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      )}

      {output !== null && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">Resultado</span>
            <div className="flex gap-2">
              {output && (
                <button
                  onClick={swapInputOutput}
                  className="flex items-center gap-1 rounded px-2 py-1 text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Usar como entrada
                </button>
              )}
              <button
                onClick={copyToClipboard}
                className="flex items-center gap-1 rounded px-2 py-1 text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
                Copiar
              </button>
            </div>
          </div>
          <pre className="overflow-auto max-h-40 rounded-lg border border-slate-800 bg-slate-900/40 p-3 text-xs font-mono text-slate-300 break-all whitespace-pre-wrap">
            {output}
          </pre>
        </div>
      )}
    </div>
  );
}
