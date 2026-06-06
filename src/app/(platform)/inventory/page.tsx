import { HomeLabInventory } from "@/components/inventory/home-lab-inventory";

export default function InventoryPage() {
  return (
    <main>
      <h1 className="text-3xl font-semibold text-slate-100">Home Lab Inventory</h1>
      <p className="mt-2 text-sm text-slate-400">Inventario empresarial con CRUD completo, relaciones, búsqueda, filtros y paginación.</p>
      <HomeLabInventory />
    </main>
  );
}
