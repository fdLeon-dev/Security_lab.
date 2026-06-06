import { WriteupCenter } from "@/components/writeups/writeup-center";

export default function WriteupsPage() {
  return (
    <main>
      <h1 className="text-3xl font-semibold text-slate-100">Writeup Center</h1>
      <p className="mt-2 text-sm text-slate-400">CRUD documental con editor Markdown, render seguro, imágenes, código y vista previa profesional.</p>
      <WriteupCenter />
    </main>
  );
}
