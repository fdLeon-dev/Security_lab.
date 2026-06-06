"use client";

import { useState } from "react";
import { ShieldAlert, CheckCircle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type Check = { id: string; label: string; pass: boolean; info: string };
type Result = {
  checks: Check[];
  passed: number;
  total: number;
  score: number;
  entropy: number;
  strength: "weak" | "moderate" | "strong" | "very_strong";
};

const STRENGTH_CONFIG = {
  weak:       { label: "Débil",        color: "text-red-400",    bar: "bg-red-500",     pct: "w-1/4" },
  moderate:   { label: "Moderada",     color: "text-yellow-400", bar: "bg-yellow-500",  pct: "w-2/4" },
  strong:     { label: "Fuerte",       color: "text-emerald-400", bar: "bg-emerald-500", pct: "w-3/4" },
  very_strong:{ label: "Muy fuerte",   color: "text-sky-400",    bar: "bg-sky-500",     pct: "w-full" },
};

export function PasswordChecker() {
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/toolkit/password-policy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Error en evaluación");
      setResult(json as Result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  }

  const cfg = result ? STRENGTH_CONFIG[result.strength] : null;

  return (
    <div className="space-y-4">
      <div className="rounded-lg bg-amber-900/20 border border-amber-700/30 px-4 py-2 text-xs text-amber-300">
        Las contraseñas se evalúan en el servidor solo para análisis y nunca se almacenan ni registran.
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex gap-2">
          <input
            type={showPw ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Introduce una contraseña para evaluar…"
            autoComplete="new-password"
            className="flex-1 rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
          />
          <button
            type="button"
            onClick={() => setShowPw((v) => !v)}
            className="rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-xs text-slate-400 hover:text-slate-200"
          >
            {showPw ? "Ocultar" : "Mostrar"}
          </button>
          <button
            type="submit"
            disabled={!password || loading}
            className="flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-sm text-white hover:bg-sky-500 disabled:opacity-50"
          >
            <ShieldAlert className="h-4 w-4" />
            {loading ? "Evaluando…" : "Evaluar"}
          </button>
        </div>
      </form>

      {error && (
        <p className="rounded-lg bg-red-900/40 border border-red-700/40 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      )}

      {result && cfg && (
        <div className="space-y-4">
          <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className={cn("text-sm font-semibold", cfg.color)}>
                {cfg.label} — Puntuación: {result.score}%
              </span>
              <span className="text-xs text-slate-400">
                Entropía ≈ {result.entropy} bits
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-800">
              <div className={cn("h-2 rounded-full transition-all", cfg.bar, cfg.pct)} />
            </div>
          </div>

          <div className="space-y-1.5">
            {result.checks.map((check) => (
              <div
                key={check.id}
                className="flex items-center gap-2 rounded px-2 py-1.5"
              >
                {check.pass ? (
                  <CheckCircle className="h-4 w-4 shrink-0 text-emerald-400" />
                ) : (
                  <XCircle className="h-4 w-4 shrink-0 text-red-400" />
                )}
                <span className={cn("text-sm", check.pass ? "text-slate-300" : "text-slate-400")}>
                  {check.label}
                  {check.info && (
                    <span className="ml-1.5 text-xs text-slate-500">({check.info})</span>
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
