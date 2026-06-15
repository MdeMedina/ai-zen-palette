import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { Download, Pencil, Plus, Trash2, Upload, X } from "lucide-react";
import { brandsApi, knowledgeApi } from "@/lib/api";
import type { AssetType, Brand, KnowledgeAsset } from "@/lib/api/types";
import { PassivePulse } from "@/components/brand/PassivePulse";
import { ErrorBanner } from "@/components/brand/ErrorBanner";
import { PageHeader } from "@/components/brand/PageHeader";

import { useSessionStore } from "@/stores/session";
import { oracleCopy } from "@/lib/i18n/oracle";

export const Route = createFileRoute("/_app/knowledge")({
  head: () => {
    const lang = useSessionStore.getState().chatLanguage;
    const title = lang === "es" ? "PKGD OS · Bases de Conocimiento" : "PKGD OS · Knowledge Bases";
    return { meta: [{ title }] };
  },
  component: KnowledgePage,
});

// Gold & Jewel are created from Audit, not uploaded manually.
const UPLOAD_TYPES: AssetType[] = ["SOP", "Dogma"];

function KnowledgePage() {
  const qc = useQueryClient();
  const brandsQ = useQuery({ queryKey: ["brands"], queryFn: brandsApi.listBrands });
  const [brandId, setBrandId] = useState<string>("");
  
  const language = useSessionStore((s) => s.chatLanguage);
  const t = oracleCopy(language);
  const effectiveBrandId = brandId || brandsQ.data?.[0]?.id || "";
  const [brandsOpen, setBrandsOpen] = useState(false);

  const searchRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === "/" &&
        document.activeElement !== searchRef.current &&
        !(
          document.activeElement instanceof HTMLInputElement ||
          document.activeElement instanceof HTMLTextAreaElement ||
          document.activeElement instanceof HTMLSelectElement
        )
      ) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

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

  const [editingAsset, setEditingAsset] = useState<KnowledgeAsset | null>(null);
  const [deletingAsset, setDeletingAsset] = useState<KnowledgeAsset | null>(null);

  const deleteM = useMutation({
    mutationFn: knowledgeApi.deleteAsset,
    onSuccess: () => {
      setDeletingAsset(null);
      qc.invalidateQueries({ queryKey: ["knowledge", effectiveBrandId] });
    },
  });

  const updateBrandM = useMutation({
    mutationFn: ({ id, brandId }: { id: string; brandId: string }) =>
      knowledgeApi.updateBrand(id, brandId),
    onSuccess: () => {
      setEditingAsset(null);
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
        title={t.knowledgeBases}
        actions={
          <button
            type="button"
            onClick={() => setBrandsOpen(true)}
            className="inline-flex items-center gap-2 border border-foreground/15 px-4 py-2 text-[11px] uppercase tracking-[0.24em] text-foreground/80 transition-colors hover:border-[var(--accent)] hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            Manage Brands
          </button>
        }
      />
      <div className="grid flex-1 grid-cols-[420px_1fr] gap-0 overflow-hidden">
        <aside className="flex flex-col gap-5 overflow-y-auto border-r border-border p-8">
          {brandsQ.data && brandsQ.data.length === 0 ? (
            <div className="border border-destructive/20 bg-destructive/5 p-4 text-[12px] transition-all duration-300 motion-safe:animate-in motion-safe:fade-in">
              <div className="font-mono text-[10px] uppercase tracking-[0.22em] font-medium text-destructive">
                System Blocked
              </div>
              <p className="mt-2 leading-relaxed text-foreground/75">
                No brands are registered. You must create at least one Brand before you can manage or vectorise documents.
              </p>
              <button
                type="button"
                onClick={() => setBrandsOpen(true)}
                className="mt-4 inline-flex w-full items-center justify-between border border-destructive px-3 py-2 text-[10px] uppercase tracking-[0.22em] text-destructive transition-all hover:bg-destructive hover:text-destructive-foreground"
              >
                <span>Register Brand</span>
                <span className="font-mono text-[9px] opacity-60">›</span>
              </button>
            </div>
          ) : (
            <>
              <div>
                <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-foreground/45">
                  Brand
                </span>
                <div className="flex items-center gap-1 mt-1 border border-border bg-foreground/[0.01] px-2 focus-within:border-[var(--accent)] transition-colors shadow-sm rounded-[3px]">
                  <span className="font-mono text-foreground/30 select-none text-[13px] pr-1">[</span>
                  <select
                    value={effectiveBrandId}
                    onChange={(e) => setBrandId(e.target.value)}
                    className="w-full bg-transparent py-1.5 text-[13px] text-foreground outline-none cursor-pointer"
                  >
                    {brandsQ.data?.map((b) => (
                      <option key={b.id} value={b.id} className="bg-background">
                        {b.name}
                      </option>
                    ))}
                  </select>
                  <span className="font-mono text-foreground/30 select-none text-[13px] pl-1">]</span>
                </div>
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
                        "border py-1.5 text-[10px] uppercase tracking-[0.18em] transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                        assetType === t
                          ? "border-foreground/30 text-foreground bg-foreground/[0.03]"
                          : "border-border text-foreground/45 hover:text-foreground/75 hover:bg-foreground/[0.01]",
                      ].join(" ")}
                    >
                      {t}
                    </button>
                  ))}
                </div>
                <p className="mt-2 font-mono text-[9px] uppercase tracking-[0.22em] text-foreground/30">
                  Gold &amp; Jewel assets are generated from Audit sessions.
                </p>
              </div>

              <label className="block">
                <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-foreground/45">
                  Title
                </span>
                <div className="flex items-center gap-1 mt-1 border border-border bg-foreground/[0.01] px-2 focus-within:border-[var(--accent)] transition-colors shadow-sm rounded-[3px]">
                  <span className="font-mono text-foreground/30 select-none text-[13px] pr-1">[</span>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-transparent py-1.5 text-[13px] text-foreground outline-none"
                  />
                  <span className="font-mono text-foreground/30 select-none text-[13px] pl-1">]</span>
                </div>
              </label>

              {file ? (
                <div className="flex items-center justify-between border border-border bg-card px-3 py-2.5 rounded-[3px] shadow-sm motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2">
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px] text-foreground">{file.name}</div>
                    <div className="font-mono text-[9px] uppercase tracking-[0.22em] text-foreground/35 mt-0.5">
                      Ready to process · {(file.size / 1024).toFixed(1)} KB
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                    }}
                    className="ml-2 rounded-[3px] p-1 text-foreground/45 hover:bg-foreground/5 hover:text-foreground"
                    title="Clear file"
                  >
                    <X className="size-3.5" strokeWidth={1.5} />
                  </button>
                </div>
              ) : (
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (e.dataTransfer.files[0]) setFile(e.dataTransfer.files[0]);
                  }}
                  onClick={() => fileRef.current?.click()}
                  className="grid cursor-pointer place-items-center border border-dashed border-border px-6 py-8 text-center transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] hover:border-foreground/25 bg-card rounded-[3px] shadow-sm hover:shadow-md motion-safe:animate-in motion-safe:fade-in"
                >
                  <Upload className="mx-auto size-4 text-foreground/35" strokeWidth={1.5} />
                  <div className="mt-2 text-[12px] text-foreground/75">
                    Drop document or click to select
                  </div>
                  <div className="mt-1 font-mono text-[9px] uppercase tracking-[0.22em] text-foreground/35">
                    PDF · MD · TXT · DOCX
                  </div>
                </div>
              )}
              <input
                ref={fileRef}
                type="file"
                hidden
                accept=".pdf,.txt,.md,.docx"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />

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
                className="relative overflow-hidden inline-flex items-center justify-between border border-[var(--accent)] px-5 py-3 text-[11px] uppercase tracking-[0.28em] text-foreground transition-all hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)] disabled:opacity-30 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {uploadM.isPending && (
                  <div aria-hidden className="absolute inset-0 bg-foreground/5 motion-safe:animate-pulse" />
                )}
                <span className="relative z-10">{uploadM.isPending ? "Processing..." : "Process Knowledge"}</span>
                {uploadM.isPending ? (
                  <span className="relative z-10 flex gap-0.5">
                    <span className="size-1 rounded-full bg-[var(--accent)] motion-safe:animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="size-1 rounded-full bg-[var(--accent)] motion-safe:animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="size-1 rounded-full bg-[var(--accent)] motion-safe:animate-bounce" style={{ animationDelay: "300ms" }} />
                  </span>
                ) : (
                  <span className="relative z-10 font-mono text-[10px] opacity-60">›</span>
                )}
              </button>

              {uploadM.isError ? (
                <ErrorBanner
                  message="Upload failed. Check the file format and try again."
                  onRetry={() =>
                    uploadM.mutate({
                      file: file!,
                      brand_id: effectiveBrandId,
                      asset_type: assetType,
                      title,
                    })
                  }
                />
              ) : null}
            </>
          )}
        </aside>

        <section className="flex flex-col overflow-hidden">
          <div className="flex items-center justify-between gap-4 border-b border-border px-8 py-4">
            <h2 className="font-display text-[15px] text-foreground/80">Repository</h2>
            <div className="relative">
              <input
                ref={searchRef}
                type="search"
                placeholder="Search by title or type…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-72 border border-border bg-transparent pl-3 pr-8 py-1.5 text-[13px] text-foreground outline-none placeholder:text-foreground/30 transition-all duration-300 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:border-[var(--accent)]/50"
              />
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 font-mono text-[9px] font-medium text-foreground/30 border border-border px-1 rounded-[2px] pointer-events-none select-none">
                /
              </span>
            </div>
            <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-foreground/35">
              {filtered.length} / {listQ.data?.length ?? 0}
            </span>
          </div>
          <div className="flex-1 overflow-auto px-8 py-6">
            <div className="border-double-thick bg-card shadow-lg">
              <table className="w-full table-fixed text-left">
                <colgroup>
                  <col className="w-[20%]" />
                  <col className="w-[14%]" />
                  <col className="w-[9%]" />
                  <col className="w-[18%]" />
                  <col className="w-[9%]" />
                  <col className="w-[30%]" />
                </colgroup>
                <thead>
                  <tr className="border-b-4 border-double border-border bg-foreground/[0.03] text-[10px] uppercase tracking-[0.22em] text-foreground/60">
                    <th className="px-4 py-3 font-normal">Title</th>
                    <th className="px-4 py-3 font-normal">Brand</th>
                    <th className="px-4 py-3 font-normal">Type</th>
                    <th className="px-4 py-3 font-normal">Status</th>
                    <th className="px-4 py-3 font-normal">Created</th>
                    <th className="px-4 py-3 font-normal text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {listQ.isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} className="border-b border-border last:border-0">
                        {Array.from({ length: 6 }).map((_, j) => (
                          <td key={j} className="px-4 py-3 align-top">
                            <div className="h-3 animate-pulse rounded-sm bg-foreground/5" />
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : listQ.isError ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-16 text-center text-[12px] text-destructive">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <span>Failed to load knowledge assets.</span>
                          <button
                            type="button"
                            onClick={() => listQ.refetch()}
                            className="text-[11px] underline text-foreground/60 hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                          >
                            Retry Refetch
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    <>
                      {filtered.map((a, idx) => {
                        const brandName = brandsQ.data?.find((b) => b.id === a.brand_id)?.name || "—";
                        return (
                          <tr
                            key={a.id}
                            className="border-b border-dashed border-border/40 text-[13px] last:border-0 hover:bg-foreground/[0.01] transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] motion-safe:animate-in motion-safe:fade-in"
                            style={{ animationDelay: `${Math.min(idx * 30, 300)}ms` }}
                          >
                            <td className="px-4 py-3 align-top text-foreground font-semibold">
                              <span className="line-clamp-2 leading-snug" title={a.title}>{a.title}</span>
                            </td>
                            <td className="px-4 py-3 align-top text-foreground/60 font-mono text-[11px]">
                              <span className="block truncate" title={brandName}>{brandName}</span>
                            </td>
                            <td className="px-4 py-3 align-top whitespace-nowrap">
                              <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-foreground/75">
                                [ <span className="text-foreground/60 font-semibold">{a.asset_type}</span> ]
                              </span>
                            </td>
                            <td className="px-4 py-3 align-top whitespace-nowrap">
                              <VectorStatus status={a.vectorization_status} percent={a.percent} />
                            </td>
                            <td className="px-4 py-3 align-top font-mono text-[11px] text-foreground/45 whitespace-nowrap">
                              {new Date(a.created_at).toISOString().slice(0, 10)}
                            </td>
                            <td className="px-4 py-3 align-top text-right font-mono text-[11px] uppercase tracking-[0.1em]">
                              <div className="flex flex-wrap items-center justify-end gap-2 gap-y-1.5">
                                <DownloadButton asset={a} />
                                <button
                                  type="button"
                                  onClick={() => setEditingAsset(a)}
                                  className="text-foreground/45 hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                  title="Reassign Brand"
                                >
                                  [Reassign]
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setDeletingAsset(a)}
                                  className="text-destructive/60 hover:text-destructive transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                  title="Delete Document"
                                >
                                  [Delete]
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                      {filtered.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-4 py-16 text-center">
                            {listQ.data?.length === 0 ? (
                              <div className="mx-auto max-w-[400px] text-left transition-all duration-500 motion-safe:animate-in motion-safe:fade-in">
                                <pre className="font-mono text-[10px] text-foreground/35 leading-tight tracking-wider select-none text-center mb-6">
{`   [SOP / Dogma] ────► [Ingest Pipeline]
                            │
                            ▼
     [Vector DB] ◄─── [Embedding Engine]
       (Nodes)           (OKLCH Vector)`}
                                </pre>
                                <h3 className="text-center font-display text-[14px] text-foreground font-medium uppercase tracking-[0.06em]">
                                  Repository Empty
                                </h3>
                                <p className="mt-2 text-center text-[12px] leading-relaxed text-foreground/50">
                                  Vectorised assets form the core dialectical knowledge base for PKGD OS, letting the Oracle recall SOP context.
                                </p>
                                
                                <div className="mt-6 border border-border bg-card p-4 shadow-sm rounded-[3px]">
                                  <div className="font-mono text-[9px] uppercase tracking-[0.24em] text-foreground/40 mb-3 border-b border-border pb-2">
                                    Knowledge Setup Checklist
                                  </div>
                                  <ul className="space-y-2 text-[11px] text-foreground/60">
                                    <li className="flex items-center gap-2">
                                      <span className="font-mono text-[9px] text-[var(--accent)]">[1]</span>
                                      <span>Select target Brand in sidebar</span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                      <span className="font-mono text-[9px] text-[var(--accent)]">[2]</span>
                                      <span>Specify SOP or Dogma class</span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                      <span className="font-mono text-[9px] text-[var(--accent)]">[3]</span>
                                      <span>Drop PDF/TXT/MD file & click Process</span>
                                    </li>
                                  </ul>
                                </div>
                              </div>
                            ) : (
                              <div className="py-6 text-[12px] text-foreground/40 transition-all duration-300 motion-safe:animate-in motion-safe:fade-in">
                                <p>No documents found matching search filter.</p>
                                <button
                                  type="button"
                                  onClick={() => setQuery("")}
                                  className="mt-3 inline-flex border border-foreground/15 px-3 py-1.5 text-[10px] uppercase tracking-[0.22em] text-foreground/80 hover:border-foreground/35 hover:text-foreground"
                                >
                                  Clear filter
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ) : null}
                    </>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>

      {brandsOpen ? (
        <BrandsManager brands={brandsQ.data ?? []} onClose={() => setBrandsOpen(false)} />
      ) : null}

      {editingAsset ? (
        <EditBrandModal
          asset={editingAsset}
          brands={brandsQ.data ?? []}
          onClose={() => setEditingAsset(null)}
          onSave={(brandId) => updateBrandM.mutate({ id: editingAsset.id, brandId })}
        />
      ) : null}

      {deletingAsset ? (
        <DeleteDocDialog
          asset={deletingAsset}
          submitting={deleteM.isPending}
          error={deleteM.isError}
          onClose={() => {
            setDeletingAsset(null);
            deleteM.reset();
          }}
          onConfirm={() => deleteM.mutate(deletingAsset.id)}
          onRetry={() => deleteM.mutate(deletingAsset.id)}
        />
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
      className="inline-flex items-center gap-1.5 border border-border px-2.5 py-1 text-[11px] uppercase tracking-[0.2em] text-foreground/70 transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)] disabled:cursor-default disabled:opacity-30 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
    >
      <Download className="size-3" strokeWidth={1.5} /> Download
    </button>
  );
}

function VectorStatus({ status, percent }: { status: "Pending" | "Embedded" | "Error"; percent?: number }) {
  if (status === "Pending") {
    const displayPercent = percent !== undefined ? ` (${Math.round(percent)}%)` : "";
    return (
      <span className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-foreground/50">
        <PassivePulse className="size-1" /> Ingesting{displayPercent}…
      </span>
    );
  }
  if (status === "Error")
    return (
      <span className="text-[10px] uppercase tracking-[0.22em] text-destructive font-medium">Error</span>
    );
  return (
    <span className="text-[10px] uppercase tracking-[0.22em] text-foreground/75 font-medium">
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
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm transition-opacity duration-300 motion-safe:animate-in motion-safe:fade-in">
      <div className="flex w-full max-w-[520px] flex-col border-l-[6px] border-double border-border bg-[var(--card)] transition-transform duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] motion-safe:animate-in motion-safe:slide-in-from-right-full">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-foreground/40">
              Administration
            </div>
            <div className="text-[15px] text-foreground">Brands</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-[3px] p-1.5 text-foreground/40 hover:bg-foreground/5 hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring transition-colors"
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
            className="grid grid-cols-[1fr_1fr_auto] gap-2 border-b border-border p-4"
          >
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Brand name"
              className="border border-border bg-transparent px-3 py-2 text-[13px] text-foreground outline-none transition-colors duration-300 focus:border-foreground/35"
            />
            <input
              value={newIndustry}
              onChange={(e) => setNewIndustry(e.target.value)}
              placeholder="Industry"
              className="border border-border bg-transparent px-3 py-2 text-[13px] text-foreground outline-none transition-colors duration-300 focus:border-foreground/35"
            />
            <button
              type="submit"
              disabled={createM.isPending || !newName.trim()}
              className="inline-flex items-center gap-1 border border-foreground/15 px-3.5 py-2 text-[11px] uppercase tracking-[0.24em] text-foreground/90 transition-all hover:border-[var(--accent)] hover:text-foreground disabled:opacity-40 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <Plus className="size-3" strokeWidth={2} /> New
            </button>
          </form>
          {createM.isError ? (
            <div className="px-4 pb-3">
              <ErrorBanner message="Couldn't create brand. Please try again." />
            </div>
          ) : null}
          {updateM.isError ? (
            <div className="px-4 pb-3">
              <ErrorBanner message="Couldn't update brand. Please try again." />
            </div>
          ) : null}

          <ul className="divide-y divide-border">
            {brands.map((b) => (
              <BrandRow
                key={b.id}
                brand={b}
                onSave={(patch) => updateM.mutate({ id: b.id, patch })}
                onDelete={() => deleteM.mutate(b.id)}
              />
            ))}
          </ul>
          {deleteM.isError ? (
            <div className="p-4">
              <ErrorBanner message="Couldn't delete brand. Please try again." />
            </div>
          ) : null}
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
          className="border border-border bg-transparent px-3 py-2 text-[13px] text-foreground outline-none transition-colors duration-300 focus:border-foreground/35"
        />
        <input
          value={industry}
          onChange={(e) => setIndustry(e.target.value)}
          className="border border-border bg-transparent px-3 py-2 text-[13px] text-foreground outline-none transition-colors duration-300 focus:border-foreground/35"
        />
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => {
              onSave({ name, industry });
              setEditing(false);
            }}
            className="border border-foreground/15 px-3 py-2 text-[11px] uppercase tracking-[0.24em] text-foreground/80 transition-all hover:border-[var(--accent)] hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
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
            className="border border-border px-3 py-2 text-[11px] uppercase tracking-[0.24em] text-foreground/60 hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
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
      <div className="flex gap-2.5 font-mono text-[11px] uppercase tracking-[0.1em]">
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="text-foreground/45 hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          [Edit]
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="text-destructive/60 hover:text-destructive transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          [Delete]
        </button>
      </div>
    </li>
  );
}

/* ---------- Edit Brand Modal ---------- */

interface EditBrandModalProps {
  asset: KnowledgeAsset;
  brands: Brand[];
  onClose: () => void;
  onSave: (brandId: string) => void;
}

function EditBrandModal({ asset, brands, onClose, onSave }: EditBrandModalProps) {
  const [selectedBrandId, setSelectedBrandId] = useState(asset.brand_id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity duration-300 motion-safe:animate-in motion-safe:fade-in">
      <div className="w-full max-w-[400px] border border-border bg-[var(--card)] p-6 shadow-xl rounded-[4px] transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] motion-safe:animate-in motion-safe:zoom-in-95">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-foreground/40">
              Asset
            </div>
            <div className="text-[15px] font-medium text-foreground">Reassign Brand</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-[3px] p-1.5 text-foreground/40 hover:bg-foreground/5 hover:text-foreground"
          >
            <X className="size-4" strokeWidth={1.5} />
          </button>
        </div>

        <div className="mt-4">
          <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-foreground/45">
            Select New Brand
          </div>
          <select
            value={selectedBrandId}
            onChange={(e) => setSelectedBrandId(e.target.value)}
            className="mt-2 w-full border-b border-border bg-transparent py-2 text-[14px] text-foreground outline-none"
          >
            {brands.map((b) => (
              <option key={b.id} value={b.id} className="bg-background text-foreground">
                {b.name}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="border border-border px-4 py-2 text-[11px] uppercase tracking-[0.22em] text-foreground/60 hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onSave(selectedBrandId)}
            className="border border-[var(--accent)] px-4 py-2 text-[11px] uppercase tracking-[0.22em] text-[var(--accent)] hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------- Delete Document Dialog ---------- */

function DeleteDocDialog({
  asset,
  submitting,
  error,
  onClose,
  onConfirm,
  onRetry,
}: {
  asset: KnowledgeAsset;
  submitting: boolean;
  error: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onRetry?: () => void;
}) {
  const [confirm, setConfirm] = useState("");
  const matches = confirm.trim().toLowerCase() === asset.title.toLowerCase();

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 backdrop-blur-sm transition-opacity duration-300 motion-safe:animate-in motion-safe:fade-in">
      <div className="w-full max-w-[440px] border border-border bg-[var(--card)] transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] motion-safe:animate-in motion-safe:zoom-in-95">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-destructive">
              Destructive
            </div>
            <div className="text-[15px] text-foreground">Delete document</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-[3px] p-1.5 text-foreground/40 hover:bg-foreground/5 hover:text-foreground"
          >
            <X className="size-4" strokeWidth={1.5} />
          </button>
        </div>
        <div className="px-6 py-5">
          <p className="text-[13px] text-foreground/70">
            This action permanently removes{" "}
            <strong className="text-foreground">{asset.title}</strong> and its vectorized data.
            Type <span className="font-mono text-[var(--accent)]">{asset.title}</span> to confirm.
          </p>
          <input
            type="text"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder={asset.title}
            className="mt-4 w-full border border-border bg-transparent px-3 py-2 font-mono text-[13px] text-foreground outline-none focus:border-destructive/60"
          />
          {error ? (
            <div className="mt-3">
              <ErrorBanner
                message="Couldn't delete document. Please try again."
                onRetry={onRetry}
              />
            </div>
          ) : null}
        </div>
        <div className="flex justify-end gap-2 border-t border-border px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="border border-border px-4 py-2 text-[11px] uppercase tracking-[0.24em] text-foreground/60 hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!matches || submitting}
            onClick={onConfirm}
            className="border border-destructive bg-destructive/10 px-4 py-2 text-[11px] uppercase tracking-[0.24em] text-destructive hover:bg-destructive hover:text-destructive-foreground disabled:opacity-30 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            {submitting ? "Deleting…" : "Delete document"}
          </button>
        </div>
      </div>
    </div>
  );
}