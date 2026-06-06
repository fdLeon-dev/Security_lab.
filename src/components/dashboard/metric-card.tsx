type MetricCardProps = {
  label: string;
  value: string | number;
  helper?: string;
};

export function MetricCard({ label, value, helper }: MetricCardProps) {
  return (
    <article className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 shadow-[0_20px_60px_-45px_rgba(14,165,233,0.9)]">
      <p className="text-xs uppercase tracking-[0.12em] text-slate-400">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-slate-100">{value}</p>
      {helper ? <p className="mt-1 text-sm text-slate-400">{helper}</p> : null}
    </article>
  );
}
