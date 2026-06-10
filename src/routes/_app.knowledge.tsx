import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useRef, useState } from "react";
import { Download, Pencil, Plus, Trash2, Upload, X } from "lucide-react";
import { brandsApi, knowledgeApi } from "@/lib/api";
import type { AssetType, Brand, KnowledgeAsset } from "@/lib/api/types";
import { PassivePulse } from "@/components/brand/PassivePulse";
import { PageHeader } from "./_app.hive";

export const Route = createFileRoute("/_app/knowledge")({
  head: () => ({ meta: [{ title: "PKGD OS · Knowledge Pipeline" }] }),
  component: KnowledgePage,
});

// Gold & Jewel are created from Audit, not uploaded manually.
const UPLOAD_TYPES: AssetType[] = ["SOP", "Dogma"];

function KnowledgePage() {
  const qc = useQueryClient();
  const brandsQ = useQuery({ queryKey: ["brands"], queryFn: brandsApi.listBrands });
  const [brandId, setBrandId] = useState<string>("");
  const effectiveBrandId = brandId || brandsQ.data?.[0]?.id || "";
  const [brandsOpen, setBrandsOpen] = useState(false);

  const listQ = useQuery({
    queryKey: ["knowledge", effectiveBrandId],
    queryFn: () => knowledgeApi.listByBrand(effectiveBrandId),
    enabled: !!effectiveBrandId,
    refetchInterval: (q) =>
      q.state.data?.some((a) => a.vectorization_status === "Pending") ? 5000 : false,
  });

  const [title, setTitle] = useState("");
  const [assetType, setAssetType] = useState<AssetType>("SOP");
  const [file, setFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const uploadM = useMutation({
    mutationFn: knowledgeApi.upload,
    onSuccess: () => {
      setTitle("");
      setFile(null);
      qc.invalidateQueries({ queryKey: ["knowledge", effectiveBrandId] });
    },
  });

  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    if (!listQ.data) return [];
    const q = query.trim().toLowerCase();
    if (!q) return listQ.data;
    return listQ.data.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.asset_type.toLowerCase().includes(q),
    );
  }, [listQ.data, query]);

  return (
    <div className="flex h-screen flex-col">
      <PageHeader
        eyebrow="Administration"
        title="Knowledge Pipeline"
        actions={
          <button
            type="button"
            onClick={() => setBrandsOpen(true)}
            className="inline-flex items-center gap-2 border border-foreground/15 px-4 py-2 text-[11px] uppercase tracking-[0.24em] text-foreground/80 transition-colors hover:border-[var(--accent)] hover:text-foreground"
          >
            Manage Brands
          </button>
        }
      />
      <div className="grid flex-1 grid-cols-[420px_1fr] gap-0 overflow-hidden">
        <aside className="flex flex-col gap-5 overflow-y-auto border-r border-foreground/5 p-8">
          <div>
            <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-foreground/45">
              Brand
            </span>
            <select
              value={effectiveBrandId}
              onChange={(e) => setBrandId(e.target.value)}
              className="mt-1 w-full border-b border-foreground/10 bg-transparent py-2 text-[14px] text-foreground outline-none"
            >
              {brandsQ.data?.map((b) => (
                <option key={b.id} value={b.id} className="bg-background">
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-foreground/45">
              Asset Type
            </span>
            <div className="mt-2 grid grid-cols-2 gap-1">
              {UPLOAD_TYPES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setAssetType(t)}
                  className={[
                    "border px-2 py-1.5 text-[11px] uppercase tracking-[0.18em] transition-colors",
                    assetType === t
                      ? "border-[var(--accent)] text-[var(--accent)]"
                      : "border-foreground/10 text-foreground/55 hover:text-foreground",
                  ].join(" ")}
                >
                  {t}
                </button>
              ))}
            </div>
            <p className="mt-2 font-mono text-[9px] uppercase tracking-[0.22em] text-foreground/30">
              Gold &amp; Jewel se generan desde Audit
            </p>
          </div>

          <label className="block">
            <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-foreground/45">
              Title
            </span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 w-full border-b border-foreground/10 bg-transparent py-2 text-[14px] text-foreground outline-none focus:border-[var(--accent)]/60"
            />
          </label>

          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (e.dataTransfer.files[0]) setFile(e.dataTransfer.files[0]);
            }}
            onClick={() => fileRef.current?.click()}
            className="grid cursor-pointer place-items-center border border-dashed border-[var(--accent)]/40 px-6 py-10 text-center transition-colors hover:border-[var(--accent)]/80"
          >
            <Upload className="mx-auto size-5 text-[var(--accent)]" strokeWidth={1.5} />
            <div className="mt-3 text-[13px] text-foreground">
              {file ? file.name : "Drop document or click to select"}
            </div>
            <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.24em] text-foreground/35">
              PDF · MD · TXT · DOCX
            </div>
            <input
              ref={fileRef}
              type="file"
              hidden
              accept=".pdf,.txt,.md,.docx"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </div>

          <button
            type="button"
            disabled={!file || !effectiveBrandId || uploadM.isPending}
            onClick={() =>
              uploadM.mutate({
                file: file!,
                brand_id: effectiveBrandId,
                asset_type: assetType,
                title,
              })
            }
            className="inline-flex items-center justify-between border border-[var(--accent)] px-5 py-3 text-[11px] uppercase tracking-[0.28em] text-foreground transition-all hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)] disabled:opacity-30"
          >
            <span>Process Knowledge</span>
            <span className="font-mono text-[10px] opacity-60">›</span>
          </button>
        </aside>

        <section className="flex flex-col overflow-hidden">
          <div className="flex items-center justify-between gap-4 border-b border-foreground/5 px-8 py-4">
            <h2 className="font-display text-[15px] text-foreground/80">Repository</h2>
            <input
              type="search"
              placeholder="Buscar título o tipo…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-72 border border-foreground/10 bg-transparent px-3 py-1.5 text-[13px] text-foreground outline-none placeholder:text-foreground/30 focus:border-[var(--accent)]/50"
            />
            <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-foreground/35">
              {filtered.length} / {listQ.data?.length ?? 0}
            </span>
          </div>
          <div className="flex-1 overflow-auto px-8 py-6">
            <div className="border border-foreground/5">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-foreground/5 text-[10px] uppercase tracking-[0.22em] text-foreground/40">
                    <th className="px-4 py-3 font-normal">Title</th>
                    <th className="px-4 py-3 font-normal">Type</th>
                    <th className="px-4 py-3 font-normal">Status</th>
                    <th className="px-4 py-3 font-normal">Created</th>
                    <th className="px-4 py-3 font-normal text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((a) => (
                    <tr key={a.id} className="border-b border-foreground/5 text-[13px] last:border-0">
                      <td className="px-4 py-3 text-foreground">{a.title}</td>
                      <td className="px-4 py-3">
                        <span className="border border-foreground/15 px-2 py-0.5 text-[10px] uppercase tracking-[0.2em] text-foreground/70">
                          {a.asset_type}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <VectorStatus status={a.vectorization_status} percent={a.percent} />
                      </td>
                      <td className="px-4 py-3 font-mono text-[11px] text-foreground/40">
                        {new Date(a.created_at).toISOString().slice(0, 10)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <DownloadButton asset={a} />
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-12 text-center text-[12px] text-foreground/40">
                        Sin resultados.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>

      {brandsOpen ? (
        <BrandsManager brands={brandsQ.data ?? []} onClose={() => setBrandsOpen(false)} />
      ) : null}
    </div>
  );
}

function DownloadButton({ asset }: { asset: KnowledgeAsset }) {
  const m = useMutation({ mutationFn: () => knowledgeApi.downloadAsset(asset) });
  const disabled = asset.vectorization_status !== "Embedded" || m.isPending;
  return (
    <button
      type="button"
      onClick={() => m.mutate()}
      disabled={disabled}
      className="inline-flex items-center gap-1.5 border border-foreground/10 px-2.5 py-1 text-[11px] uppercase tracking-[0.2em] text-foreground/70 transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)] disabled:cursor-default disabled:opacity-30"
    >
      <Download className="size-3" strokeWidth={1.5} /> Download
    </button>
  );
}

function VectorStatus({ status, percent }: { status: "Pending" | "Embedded" | "Error"; percent?: number }) {
  if (status === "Pending") {
    const displayPercent = percent !== undefined ? ` (${Math.round(percent)}%)` : "";
    return (
      <span className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-foreground/55">
        <PassivePulse /> Ingesting{displayPercent}…
      </span>
    );
  }
  if (status === "Error")
    return (
      <span className="text-[11px] uppercase tracking-[0.2em] text-destructive">Error</span>
    );
  return (
    <span className="text-[11px] uppercase tracking-[0.2em] text-[var(--accent)]">
      Embedded
    </span>
  );
}

/* ---------- Brands CRUD drawer ---------- */

function BrandsManager({ brands, onClose }: { brands: Brand[]; onClose: () => void }) {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ["brands"] });

  const createM = useMutation({ mutationFn: brandsApi.createBrand, onSuccess: invalidate });
  const updateM = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: { name?: string; industry?: string } }) =>
      brandsApi.updateBrand(id, patch),
    onSuccess: invalidate,
  });
  const deleteM = useMutation({ mutationFn: brandsApi.deleteBrand, onSuccess: invalidate });

  const [newName, setNewName] = useState("");
  const [newIndustry, setNewIndustry] = useState("");

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
      <div className="flex w-full max-w-[520px] flex-col border-l border-foreground/10 bg-[var(--card)]">
        <div className="flex items-center justify-between border-b border-foreground/5 px-6 py-4">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-foreground/40">
              Administration
            </div>
            <div className="text-[15px] text-foreground">Brands</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-[3px] p-1.5 text-foreground/40 hover:bg-foreground/5 hover:text-foreground"
          >
            <X className="size-4" strokeWidth={1.5} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!newName.trim()) return;
              createM.mutate(
                { name: newName.trim(), industry: newIndustry.trim() || "—" },
                {
                  onSuccess: () => {
                    setNewName("");
                    setNewIndustry("");
                  },
                },
              );
            }}
            className="grid grid-cols-[1fr_1fr_auto] gap-2 border-b border-foreground/5 p-4"
          >
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Brand name"
              className="border border-foreground/10 bg-transparent px-3 py-2 text-[13px] text-foreground outline-none focus:border-[var(--accent)]/50"
            />
            <input
              value={newIndustry}
              onChange={(e) => setNewIndustry(e.target.value)}
              placeholder="Industry"
              className="border border-foreground/10 bg-transparent px-3 py-2 text-[13px] text-foreground outline-none focus:border-[var(--accent)]/50"
            />
            <button
              type="submit"
              disabled={createM.isPending || !newName.trim()}
              className="inline-flex items-center gap-1 border border-[var(--accent)] px-3 py-2 text-[11px] uppercase tracking-[0.22em] text-foreground hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)] disabled:opacity-40"
            >
              <Plus className="size-3" strokeWidth={2} /> New
            </button>
          </form>

          <ul className="divide-y divide-foreground/5">
            {brands.map((b) => (
              <BrandRow
                key={b.id}
                brand={b}
                onSave={(patch) => updateM.mutate({ id: b.id, patch })}
                onDelete={() => deleteM.mutate(b.id)}
              />
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function BrandRow({
  brand,
  onSave,
  onDelete,
}: {
  brand: Brand;
  onSave: (patch: { name?: string; industry?: string }) => void;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(brand.name);
  const [industry, setIndustry] = useState(brand.industry);

  if (editing) {
    return (
      <li className="grid grid-cols-[1fr_1fr_auto] gap-2 p-4">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="border border-foreground/10 bg-transparent px-3 py-2 text-[13px] text-foreground outline-none focus:border-[var(--accent)]/50"
        />
        <input
          value={industry}
          onChange={(e) => setIndustry(e.target.value)}
          className="border border-foreground/10 bg-transparent px-3 py-2 text-[13px] text-foreground outline-none focus:border-[var(--accent)]/50"
        />
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => {
              onSave({ name, industry });
              setEditing(false);
            }}
            className="border border-[var(--accent)] px-3 py-2 text-[11px] uppercase tracking-[0.22em] text-[var(--accent)] hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)]"
          >
            Save
          </button>
          <button
            type="button"
            onClick={() => {
              setName(brand.name);
              setIndustry(brand.industry);
              setEditing(false);
            }}
            className="border border-foreground/10 px-3 py-2 text-[11px] uppercase tracking-[0.22em] text-foreground/60 hover:text-foreground"
          >
            Cancel
          </button>
        </div>
      </li>
    );
  }

  return (
    <li className="flex items-center justify-between gap-4 px-4 py-3">
      <div className="min-w-0">
        <div className="truncate text-[13px] text-foreground">{brand.name}</div>
        <div className="truncate font-mono text-[10px] uppercase tracking-[0.22em] text-foreground/40">
          {brand.industry} · {brand.status}
        </div>
      </div>
      <div className="flex gap-1">
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="rounded-[3px] p-2 text-foreground/50 hover:bg-foreground/5 hover:text-foreground"
          aria-label="Edit"
        >
          <Pencil className="size-3.5" strokeWidth={1.5} />
        </button>
        <button
          type="button"
          onClick={() => {
            if (confirm(`Delete brand "${brand.name}"?`)) onDelete();
          }}
          className="rounded-[3px] p-2 text-foreground/50 hover:bg-destructive/10 hover:text-destructive"
          aria-label="Delete"
        >
          <Trash2 className="size-3.5" strokeWidth={1.5} />
        </button>
      </div>
    </li>
  );
}