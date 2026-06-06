"use client";

import { useState } from "react";
import { Globe, ShieldCheck, FileSearch2, Hash, Braces, KeyRound, History, Binary } from "lucide-react";
import { cn } from "@/lib/utils";
import { DnsLookup } from "./tools/dns-lookup";
import { SslChecker } from "./tools/ssl-checker";
import { LogAnalyzer } from "./tools/log-analyzer";
import { HashUtilities } from "./tools/hash-utilities";
import { JsonFormatter } from "./tools/json-formatter";
import { Base64Tool } from "./tools/base64-tool";
import { PasswordChecker } from "./tools/password-checker";
import { ToolkitHistory } from "./toolkit-history";

type TabId =
  | "dns"
  | "ssl"
  | "logs"
  | "hash"
  | "json"
  | "base64"
  | "password"
  | "history";

const TABS: { id: TabId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "dns",      label: "DNS Lookup",       icon: Globe },
  { id: "ssl",      label: "SSL Checker",      icon: ShieldCheck },
  { id: "logs",     label: "Log Analyzer",     icon: FileSearch2 },
  { id: "hash",     label: "Hash Utilities",   icon: Hash },
  { id: "json",     label: "JSON Formatter",   icon: Braces },
  { id: "base64",   label: "Base64",           icon: Binary },
  { id: "password", label: "Password Policy",  icon: KeyRound },
  { id: "history",  label: "Historial",        icon: History },
];

const DESCRIPTIONS: Record<TabId, string> = {
  dns:      "Consulta registros DNS de dominios: A, AAAA, MX, CNAME, TXT y más.",
  ssl:      "Verifica el certificado TLS/SSL de un dominio: emisor, expiración y estado.",
  logs:     "Carga y analiza archivos de log, filtra por nivel y busca patrones.",
  hash:     "Genera hashes SHA-256, SHA-512 o MD5 a partir de cualquier texto.",
  json:     "Formatea JSON minificado o mal indentado de forma legible.",
  base64:   "Codifica texto a Base64 o decodifica cadenas Base64 a texto plano.",
  password: "Evalúa la política de contraseñas sin almacenarla — longitud, complejidad, entropía.",
  history:  "Historial de consultas realizadas con el toolkit (contraseñas excluidas).",
};

export function ToolkitDashboard() {
  const [active, setActive] = useState<TabId>("dns");

  return (
    <div className="space-y-6">
      {/* Tools grid / tab nav */}
      <nav className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-8">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActive(id)}
            className={cn(
              "flex flex-col items-center gap-1.5 rounded-xl border px-2 py-3 text-xs transition-colors",
              active === id
                ? "border-sky-600/70 bg-sky-600/15 text-sky-300"
                : "border-slate-800 bg-slate-900/50 text-slate-400 hover:border-slate-700 hover:text-slate-200"
            )}
          >
            <Icon className="h-5 w-5" />
            <span className="text-center leading-tight">{label}</span>
          </button>
        ))}
      </nav>

      {/* Tool panel */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-100">
            {TABS.find((t) => t.id === active)?.label}
          </h2>
          <p className="mt-0.5 text-xs text-slate-400">{DESCRIPTIONS[active]}</p>
        </div>

        {active === "dns"      && <DnsLookup />}
        {active === "ssl"      && <SslChecker />}
        {active === "logs"     && <LogAnalyzer />}
        {active === "hash"     && <HashUtilities />}
        {active === "json"     && <JsonFormatter />}
        {active === "base64"   && <Base64Tool />}
        {active === "password" && <PasswordChecker />}
        {active === "history"  && <ToolkitHistory />}
      </section>
    </div>
  );
}
