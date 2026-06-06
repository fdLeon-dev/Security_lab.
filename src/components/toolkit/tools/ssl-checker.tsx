"use client";

import { useState } from "react";
import { ShieldCheck, AlertTriangle, CheckCircle, XCircle } from "lucide-react";

type CertInfo = {
  subject: Record<string, string>;
  issuer: Record<string, string>;
  validFrom: string;
  validTo: string;
  fingerprint: string;
  daysRemaining: number;
};

export function SslChecker() {
  const [domain, setDomain] = useState("");
  const [port, setPort] = useState("443");
  const [cert, setCert] = useState<CertInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setCert(null);
    setLoading(true);
    try {
      const res = await fetch("/api/toolkit/ssl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: domain.trim(), port: Number(port) }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Error al verificar SSL");
      setCert(json.cert);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  }

  const isExpiringSoon = cert && cert.daysRemaining >= 0 && cert.daysRemaining <= 30;
  const isExpired = cert && cert.daysRemaining < 0;

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="flex gap-2 flex-wrap">
        <input
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          placeholder="example.com"
          className="flex-1 min-w-[200px] rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
        />
        <input
          value={port}
          onChange={(e) => setPort(e.target.value)}
          placeholder="443"
          type="number"
          min="1"
          max="65535"
          className="w-24 rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-500"
        />
        <button
          type="submit"
          disabled={!domain.trim() || loading}
          className="flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-sm text-white hover:bg-sky-500 disabled:opacity-50"
        >
          <ShieldCheck className="h-4 w-4" />
          {loading ? "Verificando…" : "Verificar"}
        </button>
      </form>

      {error && (
        <p className="rounded-lg bg-red-900/40 border border-red-700/40 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      )}

      {cert && (
        <div className="space-y-3">
          <div
            className={`flex items-center gap-2 rounded-lg px-4 py-3 ${
              isExpired
                ? "bg-red-900/30 border border-red-700/40"
                : isExpiringSoon
                ? "bg-yellow-900/30 border border-yellow-700/40"
                : "bg-emerald-900/30 border border-emerald-700/40"
            }`}
          >
            {isExpired ? (
              <XCircle className="h-5 w-5 text-red-400 shrink-0" />
            ) : isExpiringSoon ? (
              <AlertTriangle className="h-5 w-5 text-yellow-400 shrink-0" />
            ) : (
              <CheckCircle className="h-5 w-5 text-emerald-400 shrink-0" />
            )}
            <span
              className={`text-sm font-medium ${
                isExpired ? "text-red-300" : isExpiringSoon ? "text-yellow-300" : "text-emerald-300"
              }`}
            >
              {isExpired
                ? `Certificado EXPIRADO hace ${Math.abs(cert.daysRemaining)} días`
                : `Válido por ${cert.daysRemaining} días más`}
            </span>
          </div>

          <div className="grid gap-2 rounded-lg border border-slate-800 bg-slate-900/40 p-4">
            {[
              ["Sujeto (CN)", cert.subject?.CN ?? cert.subject?.O ?? "—"],
              ["Organización emisora", cert.issuer?.O ?? cert.issuer?.CN ?? "—"],
              ["País emisor", cert.issuer?.C ?? "—"],
              ["Válido desde", cert.validFrom],
              ["Válido hasta", cert.validTo],
              ["Huella SHA-1", cert.fingerprint],
            ].map(([label, value]) => (
              <div key={label} className="flex flex-col gap-0.5">
                <span className="text-xs text-slate-500">{label}</span>
                <span className="font-mono text-xs text-slate-300 break-all">{value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
