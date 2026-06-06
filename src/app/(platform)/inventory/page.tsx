export default function InventoryPage() {
  return (
    <main>
      <h1 className="text-3xl font-semibold text-slate-100">Home Lab Inventory</h1>
      <p className="mt-2 text-sm text-slate-400">Inventario de infraestructura local: equipos, VMs, redes, servicios y topologías.</p>

      <section className="mt-6 grid gap-4 md:grid-cols-3">
        <article className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
          <h2 className="text-lg font-semibold">Equipos</h2>
          <p className="mt-2 text-sm text-slate-400">Hosts físicos, estado y especificaciones.</p>
        </article>
        <article className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
          <h2 className="text-lg font-semibold">Máquinas virtuales</h2>
          <p className="mt-2 text-sm text-slate-400">Sistema operativo, IP, rol y snapshots.</p>
        </article>
        <article className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
          <h2 className="text-lg font-semibold">Topologías</h2>
          <p className="mt-2 text-sm text-slate-400">Segmentación de red, VLANs y servicios expuestos.</p>
        </article>
      </section>
    </main>
  );
}
