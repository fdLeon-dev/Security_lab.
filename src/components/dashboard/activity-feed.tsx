type ActivityItem = {
  id: string;
  title: string;
  type: string;
  detail: string;
  date: string;
};

export function ActivityFeed({ items }: { items: ActivityItem[] }) {
  return (
    <article className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
      <h2 className="text-lg font-semibold text-slate-100">Actividad reciente</h2>
      <div className="mt-5 space-y-4">
        {items.map((item) => (
          <div key={item.id} className="border-l border-sky-400/40 pl-4">
            <p className="text-sm font-medium text-slate-100">{item.title}</p>
            <p className="mt-1 text-xs uppercase tracking-[0.12em] text-sky-300">{item.type}</p>
            <p className="mt-1 text-sm text-slate-400">{item.detail}</p>
            <p className="mt-2 text-xs text-slate-500">{item.date}</p>
          </div>
        ))}
      </div>
    </article>
  );
}
