"use client";

import { WriteupCategory, WriteupVisibility } from "@prisma/client";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { Eye, FileText, PencilLine, Plus, Save, Search, Trash2 } from "lucide-react";
import Image from "next/image";
import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import remarkGfm from "remark-gfm";
import { slugify } from "@/lib/utils";

type Writeup = {
  id: string;
  title: string;
  slug: string;
  content: string;
  tags: string[];
  category: WriteupCategory;
  visibility: WriteupVisibility;
  createdAt: string;
  updatedAt: string;
};

type WriteupForm = {
  title: string;
  slug: string;
  content: string;
  tags: string;
  category: WriteupCategory;
  visibility: WriteupVisibility;
};

const categoryOptions = [
  { value: WriteupCategory.LINUX, label: "Linux" },
  { value: WriteupCategory.WINDOWS, label: "Windows" },
  { value: WriteupCategory.WEB, label: "Web" },
  { value: WriteupCategory.ACTIVE_DIRECTORY, label: "Active Directory" },
  { value: WriteupCategory.CLOUD, label: "Cloud" },
  { value: WriteupCategory.NETWORK, label: "Network" },
];

const visibilityOptions = [
  { value: WriteupVisibility.PRIVATE, label: "Private" },
  { value: WriteupVisibility.INTERNAL, label: "Internal" },
  { value: WriteupVisibility.PUBLIC, label: "Public" },
];

const emptyForm: WriteupForm = {
  title: "",
  slug: "",
  content: "# Nuevo writeup\n\n## Contexto\n\nDocumenta el laboratorio, pasos defensivos, hallazgos y lecciones aprendidas.\n\n```bash\n# comandos relevantes\n```",
  tags: "",
  category: WriteupCategory.WEB,
  visibility: WriteupVisibility.PRIVATE,
};

function enumLabel(value: string, options: Array<{ value: string; label: string }>) {
  return options.find((option) => option.value === value)?.label ?? value;
}

async function parseResponse(response: Response) {
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.error ?? "Request failed");
  }
  return data;
}

export function WriteupCenter() {
  const [writeups, setWriteups] = useState<Writeup[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [form, setForm] = useState<WriteupForm>(emptyForm);
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [category, setCategory] = useState("");
  const [visibility, setVisibility] = useState("");
  const [sortBy, setSortBy] = useState("updatedAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [mode, setMode] = useState<"edit" | "preview">("edit");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (deferredSearch) params.set("search", deferredSearch);
    if (category) params.set("category", category);
    if (visibility) params.set("visibility", visibility);
    params.set("sortBy", sortBy);
    params.set("sortOrder", sortOrder);
    return params.toString();
  }, [category, deferredSearch, sortBy, sortOrder, visibility]);

  useEffect(() => {
    let cancelled = false;

    async function loadWriteups() {
      try {
        const response = await fetch(`/api/writeups?${queryString}`, { cache: "no-store" });
        const data = (await parseResponse(response)) as Writeup[];
        if (cancelled) {
          return;
        }
        setWriteups(data);
        if (!activeId && data[0]) {
          setActiveId(data[0].id);
          setForm({
            title: data[0].title,
            slug: data[0].slug,
            content: data[0].content,
            tags: data[0].tags.join(", "),
            category: data[0].category,
            visibility: data[0].visibility,
          });
        }
        setError("");
      } catch (requestError) {
        if (!cancelled) {
          setError(requestError instanceof Error ? requestError.message : "Unable to load writeups");
        }
      }
    }

    loadWriteups();

    return () => {
      cancelled = true;
    };
  }, [activeId, queryString]);

  function selectWriteup(writeup: Writeup) {
    setActiveId(writeup.id);
    setForm({
      title: writeup.title,
      slug: writeup.slug,
      content: writeup.content,
      tags: writeup.tags.join(", "),
      category: writeup.category,
      visibility: writeup.visibility,
    });
  }

  function resetEditor() {
    setActiveId(null);
    setForm(emptyForm);
    setMode("edit");
  }

  async function saveWriteup() {
    setSaving(true);
    setError("");

    try {
      const response = await fetch(activeId ? `/api/writeups/${activeId}` : "/api/writeups", {
        method: activeId ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: form.title,
          slug: form.slug,
          content: form.content,
          tags: form.tags.split(",").map((tag) => tag.trim()).filter(Boolean),
          category: form.category,
          visibility: form.visibility,
        }),
      });

      const saved = (await parseResponse(response)) as Writeup;
      setActiveId(saved.id);

      const refresh = await fetch(`/api/writeups?${queryString}`, { cache: "no-store" });
      const data = (await parseResponse(refresh)) as Writeup[];
      setWriteups(data);
      const selected = data.find((item) => item.id === saved.id) ?? saved;
      selectWriteup(selected);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to save writeup");
    } finally {
      setSaving(false);
    }
  }

  async function removeWriteup() {
    if (!activeId) {
      resetEditor();
      return;
    }

    try {
      const response = await fetch(`/api/writeups/${activeId}`, { method: "DELETE" });
      await parseResponse(response);
      const refresh = await fetch(`/api/writeups?${queryString}`, { cache: "no-store" });
      const data = (await parseResponse(refresh)) as Writeup[];
      setWriteups(data);
      if (data[0]) {
        selectWriteup(data[0]);
      } else {
        resetEditor();
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to delete writeup");
    }
  }

  return (
    <div className="mt-6 grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
      <aside className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-100">Writeups</h2>
            <p className="mt-1 text-sm text-slate-400">Listado, búsqueda y navegación documental.</p>
          </div>
          <button type="button" onClick={resetEditor} className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-200 transition hover:border-sky-400/50">
            <Plus size={14} />
            Nuevo
          </button>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-1">
          <label className="relative">
            <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por título, slug o contenido" className="w-full rounded-lg border border-slate-700 bg-slate-950 py-2 pl-9 pr-3 text-sm text-slate-100 outline-none ring-sky-400 focus:ring-2" />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <select value={category} onChange={(event) => setCategory(event.target.value)} className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100">
              <option value="">Todas las categorías</option>
              {categoryOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
            <select value={visibility} onChange={(event) => setVisibility(event.target.value)} className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100">
              <option value="">Toda visibilidad</option>
              {visibilityOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <select value={sortBy} onChange={(event) => setSortBy(event.target.value)} className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100">
              <option value="updatedAt">Updated</option>
              <option value="createdAt">Created</option>
              <option value="title">Title</option>
            </select>
            <select value={sortOrder} onChange={(event) => setSortOrder(event.target.value)} className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100">
              <option value="desc">Desc</option>
              <option value="asc">Asc</option>
            </select>
          </div>
        </div>

        <div className="mt-5 space-y-3">
          {writeups.map((writeup) => (
            <button key={writeup.id} type="button" onClick={() => selectWriteup(writeup)} className={`w-full rounded-xl border p-4 text-left transition ${activeId === writeup.id ? "border-sky-400/50 bg-sky-500/10" : "border-slate-800 bg-slate-950/60 hover:border-slate-700"}`}>
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold text-slate-100">{writeup.title}</h3>
                <span className="rounded-full bg-slate-800 px-2 py-1 text-[11px] text-slate-300">{enumLabel(writeup.visibility, visibilityOptions)}</span>
              </div>
              <p className="mt-2 text-xs text-slate-400">/{writeup.slug}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {writeup.tags.slice(0, 3).map((tag) => (
                  <span key={tag} className="rounded-full border border-slate-700 px-2 py-1 text-[11px] text-slate-300">#{tag}</span>
                ))}
              </div>
            </button>
          ))}
          {!writeups.length ? <p className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 text-sm text-slate-400">No hay writeups para los filtros actuales.</p> : null}
        </div>
      </aside>

      <section className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-100">Editor profesional</h2>
            <p className="mt-1 text-sm text-slate-400">Markdown, preview, código, imágenes y publicación controlada.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setMode("edit")} className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${mode === "edit" ? "border-sky-400/50 bg-sky-500/10 text-sky-100" : "border-slate-700 text-slate-300"}`}>
              <PencilLine size={14} />
              Editar
            </button>
            <button type="button" onClick={() => setMode("preview")} className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${mode === "preview" ? "border-sky-400/50 bg-sky-500/10 text-sky-100" : "border-slate-700 text-slate-300"}`}>
              <Eye size={14} />
              Vista previa
            </button>
            <button type="button" onClick={saveWriteup} disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-sky-500 px-3 py-2 text-sm font-medium text-slate-950 transition hover:bg-sky-400 disabled:opacity-60">
              <Save size={14} />
              {saving ? "Guardando..." : "Guardar"}
            </button>
            <button type="button" onClick={removeWriteup} className="inline-flex items-center gap-2 rounded-lg border border-rose-500/30 px-3 py-2 text-sm text-rose-200 transition hover:bg-rose-500/10">
              <Trash2 size={14} />
              Eliminar
            </button>
          </div>
        </div>

        {error ? <p className="text-sm text-rose-400">{error}</p> : null}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="xl:col-span-2">
            <label className="text-sm text-slate-300">Título</label>
            <input value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value, slug: current.slug || slugify(event.target.value) }))} className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none ring-sky-400 focus:ring-2" />
          </div>
          <div className="xl:col-span-2">
            <label className="text-sm text-slate-300">Slug</label>
            <input value={form.slug} onChange={(event) => setForm((current) => ({ ...current, slug: slugify(event.target.value) }))} className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none ring-sky-400 focus:ring-2" />
          </div>
          <div>
            <label className="text-sm text-slate-300">Categoría</label>
            <select value={form.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value as WriteupCategory }))} className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100">
              {categoryOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm text-slate-300">Visibilidad</label>
            <select value={form.visibility} onChange={(event) => setForm((current) => ({ ...current, visibility: event.target.value as WriteupVisibility }))} className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100">
              {visibilityOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </div>
          <div className="md:col-span-2 xl:col-span-2">
            <label className="text-sm text-slate-300">Tags</label>
            <input value={form.tags} onChange={(event) => setForm((current) => ({ ...current, tags: event.target.value }))} placeholder="windows, smb, writeup" className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none ring-sky-400 focus:ring-2" />
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          <div className={mode === "preview" ? "hidden xl:block" : "block"}>
            <label className="mb-2 flex items-center gap-2 text-sm text-slate-300">
              <FileText size={14} />
              Markdown
            </label>
            <textarea value={form.content} onChange={(event) => setForm((current) => ({ ...current, content: event.target.value }))} rows={22} className="min-h-[32rem] w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 font-mono text-sm text-slate-100 outline-none ring-sky-400 focus:ring-2" />
          </div>
          <div className={mode === "edit" ? "hidden xl:block" : "block"}>
            <label className="mb-2 flex items-center gap-2 text-sm text-slate-300">
              <Eye size={14} />
              Vista previa renderizada
            </label>
            <article className="prose prose-invert min-h-[32rem] max-w-none rounded-xl border border-slate-700 bg-slate-950 px-5 py-4 prose-headings:text-slate-100 prose-p:text-slate-300 prose-code:text-sky-200 prose-pre:bg-slate-900">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeSanitize]}
                components={{
                  img: (props) => (
                    <Image
                      src={typeof props.src === "string" ? props.src : ""}
                      alt={props.alt ?? "Writeup image"}
                      width={1200}
                      height={720}
                      unoptimized
                      className="rounded-xl border border-slate-800"
                    />
                  ),
                  code: ({ children, className, ...props }) => {
                    const isBlock = className?.includes("language-");
                    if (isBlock) {
                      return <code {...props} className={className}>{children}</code>;
                    }
                    return <code {...props} className="rounded bg-slate-800 px-1 py-0.5 text-sky-200">{children}</code>;
                  },
                }}
              >
                {form.content}
              </ReactMarkdown>
            </article>
          </div>
        </div>
      </section>
    </div>
  );
}
