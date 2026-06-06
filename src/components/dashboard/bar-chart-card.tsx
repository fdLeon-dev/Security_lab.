type ChartDatum = {
  label: string;
  value: number;
  tone?: "sky" | "cyan" | "emerald" | "amber";
};

const toneClassMap: Record<NonNullable<ChartDatum["tone"]>, string> = {
  sky: "bg-sky-400",
  cyan: "bg-cyan-400",
  emerald: "bg-emerald-400",
  amber: "bg-amber-400",
};

export function BarChartCard({
  title,
  description,
  data,
}: {
  title: string;
  description: string;
  data: ChartDatum[];
}) {
  const maxValue = Math.max(...data.map((item) => item.value), 1);

  return (
    <article className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
      <h2 className="text-lg font-semibold text-slate-100">{title}</h2>
      <p className="mt-1 text-sm text-slate-400">{description}</p>
      <div className="mt-5 space-y-4">
        {data.map((item) => (
          <div key={item.label}>
            <div className="mb-2 flex items-center justify-between text-sm text-slate-300">
              <span>{item.label}</span>
              <span>{item.value}</span>
            </div>
            <div className="h-2 rounded-full bg-slate-800">
              <div
                className={`h-full rounded-full ${toneClassMap[item.tone ?? "sky"]}`}
                style={{ width: `${(item.value / maxValue) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </article>
  );
}
