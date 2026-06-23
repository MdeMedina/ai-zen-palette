import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { Download, Pencil, Plus, Trash2, Upload, X } from "lucide-react";
import { brandsApi, knowledgeApi, departmentsApi, usersApi } from "@/lib/api";
import type { AssetType, Brand, KnowledgeAsset, Department, DepartmentRole, UUID } from "@/lib/api/types";
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

  const deptsQ = useQuery({ queryKey: ["departments"], queryFn: departmentsApi.listDepartments });

  const [activeTab, setActiveTab] = useState<"brands" | "departments" | "external">("brands");
  const [deptsOpen, setDeptsOpen] = useState(false);
  const [selectedDeptId, setSelectedDeptId] = useState<string>("");
  const [uploadDeptRoleId, setUploadDeptRoleId] = useState<string>("");

  const effectiveDeptId = selectedDeptId || deptsQ.data?.[0]?.id || "";

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
    queryKey: [
      "knowledge",
      activeTab,
      activeTab === "brands"
        ? effectiveBrandId
        : activeTab === "departments"
          ? effectiveDeptId
          : "global",
    ],
    queryFn: () => {
      if (activeTab === "brands") {
        return knowledgeApi.listByBrand(effectiveBrandId);
      } else if (activeTab === "departments") {
        return knowledgeApi.listByDepartment(effectiveDeptId);
      } else {
        return knowledgeApi.listExternal();
      }
    },
    enabled:
      activeTab === "brands"
        ? !!effectiveBrandId
        : activeTab === "departments"
          ? !!effectiveDeptId
          : true,
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
      setUploadDeptRoleId("");
      qc.invalidateQueries({ queryKey: ["knowledge"] });
    },
  });

  const [editingAsset, setEditingAsset] = useState<KnowledgeAsset | null>(null);
  const [deletingAsset, setDeletingAsset] = useState<KnowledgeAsset | null>(null);

  const deleteM = useMutation({
    mutationFn: knowledgeApi.deleteAsset,
    onSuccess: () => {
      setDeletingAsset(null);
      qc.invalidateQueries({ queryKey: ["knowledge"] });
    },
  });

  const updateBrandM = useMutation({
    mutationFn: ({ id, brandId }: { id: string; brandId: string }) =>
      knowledgeApi.updateBrand(id, brandId),
    onSuccess: () => {
      setEditingAsset(null);
      qc.invalidateQueries({ queryKey: ["knowledge"] });
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
          <div className="flex gap-2">
            {activeTab === "brands" ? (
              <button
                type="button"
                onClick={() => setBrandsOpen(true)}
                className="inline-flex items-center gap-2 border border-foreground/15 px-4 py-2 text-[11px] uppercase tracking-[0.24em] text-foreground/80 transition-colors hover:border-[var(--accent)] hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                Manage Brands
              </button>
            ) : activeTab === "departments" ? (
              <button
                type="button"
                onClick={() => setDeptsOpen(true)}
                className="inline-flex items-center gap-2 border border-[var(--accent)] px-4 py-2 text-[11px] uppercase tracking-[0.24em] text-foreground transition-colors hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                Manage Departments
              </button>
            ) : null}
          </div>
        }
      />

      {/* Top Tab Bar Selector */}
      <div className="flex border-b border-border bg-foreground/[0.02] px-8">
        <button
          onClick={() => setActiveTab("brands")}
          className={`border-b-2 px-6 py-3 font-mono text-[11px] uppercase tracking-[0.2em] transition-all focus-visible:outline-none ${
            activeTab === "brands"
              ? "border-[var(--accent)] text-foreground font-semibold"
              : "border-transparent text-foreground/50 hover:text-foreground/80"
          }`}
        >
          Brands Knowledge
        </button>
        <button
          onClick={() => setActiveTab("departments")}
          className={`border-b-2 px-6 py-3 font-mono text-[11px] uppercase tracking-[0.2em] transition-all focus-visible:outline-none ${
            activeTab === "departments"
              ? "border-[var(--accent)] text-foreground font-semibold"
              : "border-transparent text-foreground/50 hover:text-foreground/80"
          }`}
        >
          Departments Knowledge
        </button>
        <button
          onClick={() => setActiveTab("external")}
          className={`border-b-2 px-6 py-3 font-mono text-[11px] uppercase tracking-[0.2em] transition-all focus-visible:outline-none ${
            activeTab === "external"
              ? "border-[var(--accent)] text-foreground font-semibold"
              : "border-transparent text-foreground/50 hover:text-foreground/80"
          }`}
        >
          External Knowledge
        </button>
      </div>
      <div className="grid flex-1 grid-cols-[420px_1fr] gap-0 overflow-hidden">
        <aside className="flex flex-col gap-5 overflow-y-auto border-r border-border p-8">
          {activeTab === "departments" && deptsQ.data && deptsQ.data.length === 0 ? (
            <div className="border border-destructive/20 bg-destructive/5 p-4 text-[12px] transition-all duration-300 motion-safe:animate-in motion-safe:fade-in">
              <div className="font-mono text-[10px] uppercase tracking-[0.22em] font-medium text-destructive">
                System Blocked
              </div>
              <p className="mt-2 leading-relaxed text-foreground/75">
                No departments are registered. You must create at least one Department before you can manage or vectorise department documents.
              </p>
              <button
                type="button"
                onClick={() => setDeptsOpen(true)}
                className="mt-4 inline-flex w-full items-center justify-between border border-destructive px-3 py-2 text-[10px] uppercase tracking-[0.22em] text-destructive transition-all hover:bg-destructive hover:text-destructive-foreground"
              >
                <span>Register Department</span>
                <span className="font-mono text-[9px] opacity-60">›</span>
              </button>
            </div>
          ) : activeTab === "brands" && brandsQ.data && brandsQ.data.length === 0 ? (
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
              {activeTab === "brands" ? (
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
                </>
              ) : activeTab === "departments" ? (
                <>
                  <div>
                    <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-foreground/45">
                      Department (Required)
                    </span>
                    <div className="flex items-center gap-1 mt-1 border border-border bg-foreground/[0.01] px-2 focus-within:border-[var(--accent)] transition-colors shadow-sm rounded-[3px]">
                      <span className="font-mono text-foreground/30 select-none text-[13px] pr-1">[</span>
                      <select
                        value={effectiveDeptId}
                        onChange={(e) => {
                          setSelectedDeptId(e.target.value);
                          setUploadDeptRoleId("");
                        }}
                        className="w-full bg-transparent py-1.5 text-[13px] text-foreground outline-none cursor-pointer"
                      >
                        {deptsQ.data?.map((d) => (
                          <option key={d.id} value={d.id} className="bg-background">
                            {d.name}
                          </option>
                        ))}
                      </select>
                      <span className="font-mono text-foreground/30 select-none text-[13px] pl-1">]</span>
                    </div>
                  </div>

                  <div>
                    <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-foreground/45">
                      Department Role (Optional)
                    </span>
                    <div className="flex items-center gap-1 mt-1 border border-border bg-foreground/[0.01] px-2 focus-within:border-[var(--accent)] transition-colors shadow-sm rounded-[3px]">
                      <span className="font-mono text-foreground/30 select-none text-[13px] pr-1">[</span>
                      <select
                        value={uploadDeptRoleId}
                        disabled={!effectiveDeptId}
                        onChange={(e) => setUploadDeptRoleId(e.target.value)}
                        className="w-full bg-transparent py-1.5 text-[13px] text-foreground outline-none cursor-pointer disabled:opacity-40"
                      >
                        <option value="" className="bg-background text-foreground/50">Select Role</option>
                        {deptsQ.data?.find((d) => d.id === effectiveDeptId)?.roles?.map((r) => (
                          <option key={r.id} value={r.id} className="bg-background text-foreground">
                            {r.name}
                          </option>
                        ))}
                      </select>
                      <span className="font-mono text-foreground/30 select-none text-[13px] pl-1">]</span>
                    </div>
                  </div>
                </>
              ) : null}

              {activeTab !== "external" ? (
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
              ) : (
                <div>
                  <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-foreground/45">
                    Asset Type
                  </span>
                  <div className="mt-1 border border-border bg-foreground/[0.03] px-3 py-2.5 rounded-[3px] shadow-sm">
                    <span className="font-mono text-[11px] uppercase tracking-[0.15em] text-foreground/70 font-semibold animate-pulse text-[var(--accent)]">
                      External Knowledge
                    </span>
                  </div>
                  <p className="mt-2 font-mono text-[9px] uppercase tracking-[0.22em] text-foreground/30">
                    External knowledge is global exogenous data independent of brands/departments.
                  </p>
                </div>
              )}

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
                disabled={
                  !file ||
                  uploadM.isPending ||
                  (activeTab === "brands"
                    ? !effectiveBrandId
                    : activeTab === "departments"
                      ? !effectiveDeptId
                      : false)
                }
                onClick={() =>
                  uploadM.mutate({
                    file: file!,
                    brand_id: activeTab === "brands" ? effectiveBrandId : undefined,
                    asset_type: activeTab === "external" ? "External" : assetType,
                    title,
                    department_id: activeTab === "departments" ? effectiveDeptId : undefined,
                    department_role_id:
                      activeTab === "departments" ? (uploadDeptRoleId || undefined) : undefined,
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
                      brand_id: activeTab === "brands" ? effectiveBrandId : undefined,
                      asset_type: activeTab === "external" ? "External" : assetType,
                      title,
                      department_id: activeTab === "departments" ? effectiveDeptId : undefined,
                      department_role_id:
                        activeTab === "departments" ? (uploadDeptRoleId || undefined) : undefined,
                    })
                  }
                />
              ) : null}
            </>
          )}
        </aside>

        <section className="flex flex-col overflow-hidden">
          <div className="flex items-center justify-between gap-4 border-b border-border px-8 py-4">
            <h2 className="font-display text-[15px] text-foreground/80">
              {activeTab === "brands"
                ? "Brand Repository"
                : activeTab === "departments"
                  ? "Department Repository"
                  : "External Repository"}
            </h2>
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
                  {activeTab === "brands" || activeTab === "external" ? (
                    <>
                      <col className="w-[35%]" />
                      <col className="w-[12%]" />
                      <col className="w-[15%]" />
                      <col className="w-[13%]" />
                      <col className="w-[25%]" />
                    </>
                  ) : (
                    <>
                      <col className="w-[25%]" />
                      <col className="w-[20%]" />
                      <col className="w-[10%]" />
                      <col className="w-[12%]" />
                      <col className="w-[10%]" />
                      <col className="w-[23%]" />
                    </>
                  )}
                </colgroup>
                <thead>
                  <tr className="border-b-4 border-double border-border bg-foreground/[0.03] text-[10px] uppercase tracking-[0.22em] text-foreground/60">
                    <th className="px-4 py-3 font-normal">Title</th>
                    {activeTab === "departments" && (
                      <th className="px-4 py-3 font-normal">Role</th>
                    )}
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
                        {Array.from({ length: activeTab === "brands" || activeTab === "external" ? 5 : 6 }).map((_, j) => (
                          <td key={j} className="px-4 py-3 align-top">
                            <div className="h-3 animate-pulse rounded-sm bg-foreground/5" />
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : listQ.isError ? (
                    <tr>
                      <td colSpan={activeTab === "brands" || activeTab === "external" ? 5 : 6} className="px-4 py-16 text-center text-[12px] text-destructive">
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
                        return (
                          <tr
                            key={a.id}
                            className="border-b border-dashed border-border/40 text-[13px] last:border-0 hover:bg-foreground/[0.01] transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] motion-safe:animate-in motion-safe:fade-in"
                            style={{ animationDelay: `${Math.min(idx * 30, 300)}ms` }}
                          >
                            <td className="px-4 py-3 align-top text-foreground font-semibold">
                              <span className="line-clamp-2 leading-snug" title={a.title}>{a.title}</span>
                            </td>
                            {activeTab === "departments" && (
                              <td className="px-4 py-3 align-top text-foreground/60 font-mono text-[11px]">
                                <span className="block truncate" title={a.department_role?.name || "All Roles"}>
                                  {a.department_role?.name || "All Roles"}
                                </span>
                              </td>
                            )}
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
                                {activeTab === "brands" ? (
                                  <button
                                    type="button"
                                    onClick={() => setEditingAsset(a)}
                                    className="text-foreground/45 hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                    title="Reassign Brand"
                                  >
                                    [Reassign]
                                  </button>
                                ) : null}
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
                          <td colSpan={activeTab === "brands" || activeTab === "external" ? 5 : 6} className="px-4 py-16 text-center">
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
                                    {activeTab !== "external" ? (
                                      <>
                                        <li className="flex items-center gap-2">
                                          <span className="font-mono text-[9px] text-[var(--accent)]">[1]</span>
                                          <span>Select target {activeTab === "brands" ? "Brand" : "Department"} in sidebar</span>
                                        </li>
                                        <li className="flex items-center gap-2">
                                          <span className="font-mono text-[9px] text-[var(--accent)]">[2]</span>
                                          <span>Specify SOP or Dogma class</span>
                                        </li>
                                        <li className="flex items-center gap-2">
                                          <span className="font-mono text-[9px] text-[var(--accent)]">[3]</span>
                                          <span>Drop PDF/TXT/MD file & click Process</span>
                                        </li>
                                      </>
                                    ) : (
                                      <>
                                        <li className="flex items-center gap-2">
                                          <span className="font-mono text-[9px] text-[var(--accent)]">[1]</span>
                                          <span>Drop external PDF/TXT/MD/DOCX file in sidebar</span>
                                        </li>
                                        <li className="flex items-center gap-2">
                                          <span className="font-mono text-[9px] text-[var(--accent)]">[2]</span>
                                          <span>Enter document title (optional)</span>
                                        </li>
                                        <li className="flex items-center gap-2">
                                          <span className="font-mono text-[9px] text-[var(--accent)]">[3]</span>
                                          <span>Click Process Knowledge to ingest</span>
                                        </li>
                                      </>
                                    )}
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

      {deptsOpen ? (
        <DepartmentsManager onClose={() => setDeptsOpen(false)} />
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
  const [selectedBrandId, setSelectedBrandId] = useState(asset.brand_id || "");

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

/* ---------- Departments Manager drawer ---------- */

function DepartmentsManager({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const deptsQ = useQuery({ queryKey: ["departments"], queryFn: departmentsApi.listDepartments });
  const operatorsQ = useQuery({ queryKey: ["operators"], queryFn: usersApi.listOperators });

  const createDeptM = useMutation({
    mutationFn: departmentsApi.createDepartment,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["departments"] }),
  });
  const updateDeptM = useMutation({
    mutationFn: ({ id, name }: { id: UUID; name: string }) => departmentsApi.updateDepartment(id, name),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["departments"] }),
  });
  const deleteDeptM = useMutation({
    mutationFn: departmentsApi.deleteDepartment,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["departments"] }),
  });

  const createRoleM = useMutation({
    mutationFn: ({ deptId, name }: { deptId: UUID; name: string }) => departmentsApi.createRole(deptId, name),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["departments"] }),
  });
  const updateRoleM = useMutation({
    mutationFn: ({ deptId, id, name }: { deptId: UUID; id: UUID; name: string }) => departmentsApi.updateRole(deptId, id, name),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["departments"] }),
  });
  const deleteRoleM = useMutation({
    mutationFn: ({ deptId, id }: { deptId: UUID; id: UUID }) => departmentsApi.deleteRole(deptId, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["departments"] }),
  });

  const assignUserM = useMutation({
    mutationFn: ({ userId, patch }: { userId: UUID; patch: Parameters<typeof usersApi.updateOperator>[1] }) =>
      usersApi.updateOperator(userId, patch),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["operators"] });
      qc.invalidateQueries({ queryKey: ["departments"] });
    },
  });

  const unassignUserM = useMutation({
    mutationFn: (userId: UUID) =>
      usersApi.updateOperator(userId, { department_id: null, department_role_id: null }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["operators"] });
      qc.invalidateQueries({ queryKey: ["departments"] });
    },
  });

  const [newDeptName, setNewDeptName] = useState("");

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm transition-opacity duration-300 motion-safe:animate-in motion-safe:fade-in">
      <div className="flex w-full max-w-[520px] flex-col border-l-[6px] border-double border-border bg-[var(--card)] transition-transform duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] motion-safe:animate-in motion-safe:slide-in-from-right-full">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-foreground/40 font-semibold">
              Administration
            </div>
            <div className="text-[15px] text-foreground font-semibold">Departments &amp; Roles</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-[3px] p-1.5 text-foreground/40 hover:bg-foreground/5 hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring transition-colors"
          >
            <X className="size-4" strokeWidth={1.5} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!newDeptName.trim()) return;
              createDeptM.mutate(newDeptName.trim(), {
                onSuccess: () => setNewDeptName(""),
              });
            }}
            className="flex gap-2"
          >
            <input
              value={newDeptName}
              onChange={(e) => setNewDeptName(e.target.value)}
              placeholder="New department name..."
              className="flex-1 border border-border bg-transparent px-3 py-2 text-[13px] text-foreground outline-none transition-colors duration-300 focus:border-foreground/35"
            />
            <button
              type="submit"
              disabled={createDeptM.isPending || !newDeptName.trim()}
              className="inline-flex items-center gap-1 border border-foreground/15 px-4 py-2 text-[11px] uppercase tracking-[0.24em] text-foreground/90 transition-all hover:border-[var(--accent)] hover:text-foreground disabled:opacity-40"
            >
              <Plus className="size-3" strokeWidth={2} /> Add
            </button>
          </form>

          {deptsQ.isLoading ? (
            <div className="text-[12px] font-mono text-foreground/45">Loading...</div>
          ) : (
            <div className="flex flex-col gap-4">
              {deptsQ.data?.map((dept) => (
                <DepartmentSection
                  key={dept.id}
                  dept={dept}
                  onUpdateDept={(name) => updateDeptM.mutate({ id: dept.id, name })}
                  onDeleteDept={() => deleteDeptM.mutate(dept.id)}
                  onCreateRole={(name) => createRoleM.mutate({ deptId: dept.id, name })}
                  onUpdateRole={(roleId, name) => updateRoleM.mutate({ deptId: dept.id, id: roleId, name })}
                  onDeleteRole={(roleId) => deleteRoleM.mutate({ deptId: dept.id, id: roleId })}
                  operators={operatorsQ.data ?? []}
                  assignUserM={assignUserM}
                  unassignUserM={unassignUserM}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DepartmentSection({
  dept,
  onUpdateDept,
  onDeleteDept,
  onCreateRole,
  onUpdateRole,
  onDeleteRole,
  operators,
  assignUserM,
  unassignUserM,
}: {
  dept: Department;
  onUpdateDept: (name: string) => void;
  onDeleteDept: () => void;
  onCreateRole: (name: string) => void;
  onUpdateRole: (roleId: UUID, name: string) => void;
  onDeleteRole: (roleId: UUID) => void;
  operators: any[];
  assignUserM: any;
  unassignUserM: any;
}) {
  const [editingDept, setEditingDept] = useState(false);
  const [deptName, setDeptName] = useState(dept.name);
  const [newRoleName, setNewRoleName] = useState("");
  const [assignUserId, setAssignUserId] = useState("");
  const [assignRoleId, setAssignRoleId] = useState("");

  const assignedUsers = operators.filter((u) => u.department_id === dept.id);

  return (
    <div className="border border-border p-4 bg-foreground/[0.01] rounded-[3px] shadow-sm">
      <div className="flex items-center justify-between border-b border-border pb-2 mb-3">
        {editingDept ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (deptName.trim()) {
                onUpdateDept(deptName.trim());
                setEditingDept(false);
              }
            }}
            className="flex-1 flex gap-2"
          >
            <input
              value={deptName}
              onChange={(e) => setDeptName(e.target.value)}
              className="flex-1 border-b border-border bg-transparent font-semibold py-0.5 text-[13px] text-foreground outline-none"
            />
            <button type="submit" className="text-[11px] font-mono text-[var(--accent)]">[Save]</button>
            <button
              type="button"
              onClick={() => {
                setDeptName(dept.name);
                setEditingDept(false);
              }}
              className="text-[11px] font-mono text-foreground/45"
            >
              [Cancel]
            </button>
          </form>
        ) : (
          <>
            <span className="font-semibold text-[13px] text-foreground">{dept.name}</span>
            <div className="flex gap-2 font-mono text-[11px]">
              <button onClick={() => setEditingDept(true)} className="text-foreground/45 hover:text-foreground">[Edit]</button>
              <button onClick={onDeleteDept} className="text-destructive/60 hover:text-destructive">[Delete]</button>
            </div>
          </>
        )}
      </div>

      <div className="pl-4 flex flex-col gap-2">
        <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-foreground/45">Roles in Department</span>
        
        {dept.roles && dept.roles.length > 0 ? (
          <ul className="flex flex-col gap-1.5">
            {dept.roles.map((role) => (
              <RoleItem
                key={role.id}
                role={role}
                onUpdate={(name) => onUpdateRole(role.id, name)}
                onDelete={() => onDeleteRole(role.id)}
              />
            ))}
          </ul>
        ) : (
          <span className="text-[11px] text-foreground/40 italic font-mono">No roles configured.</span>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (newRoleName.trim()) {
              onCreateRole(newRoleName.trim());
              setNewRoleName("");
            }
          }}
          className="mt-2 flex gap-2 border-t border-dashed border-border/60 pt-3"
        >
          <input
            value={newRoleName}
            onChange={(e) => setNewRoleName(e.target.value)}
            placeholder="Add new role..."
            className="flex-1 border-b border-border/60 bg-transparent py-0.5 font-mono text-[12px] text-foreground outline-none placeholder:text-foreground/30 focus:border-foreground/35"
          />
          <button
            type="submit"
            disabled={!newRoleName.trim()}
            className="text-[11px] uppercase tracking-[0.15em] font-medium text-foreground/75 disabled:opacity-30"
          >
            Add Role
          </button>
        </form>
      </div>

      {/* User Assignment section */}
      <div className="pl-4 mt-4 border-t border-dashed border-border/60 pt-3 flex flex-col gap-2">
        <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-foreground/45">Assigned Users</span>
        
        {assignedUsers.length > 0 ? (
          <ul className="flex flex-col gap-1.5">
            {assignedUsers.map((u) => (
              <li key={u.id} className="flex justify-between items-center text-[12px] font-mono text-foreground/70">
                <span className="truncate pr-2" title={`${u.full_name} - ${u.email}`}>
                  {u.full_name} <span className="text-foreground/40 font-light">[{u.department_role?.name || "—"}]</span>
                </span>
                <button
                  type="button"
                  onClick={() => unassignUserM.mutate(u.id)}
                  disabled={unassignUserM.isPending}
                  className="text-destructive/50 hover:text-destructive whitespace-nowrap focus-visible:outline-none"
                >
                  [Remove]
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <span className="text-[11px] text-foreground/40 italic font-mono">No users assigned.</span>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (assignUserId) {
              assignUserM.mutate({
                userId: assignUserId,
                patch: {
                  department_id: dept.id,
                  department_role_id: assignRoleId || null,
                },
              }, {
                onSuccess: () => {
                  setAssignUserId("");
                  setAssignRoleId("");
                }
              });
            }
          }}
          className="mt-2 flex flex-col gap-2 bg-foreground/[0.02] p-2 border border-border/40 rounded-[3px]"
        >
          <span className="font-mono text-[8px] uppercase tracking-[0.15em] text-foreground/40">Assign User</span>
          
          <select
            value={assignUserId}
            onChange={(e) => setAssignUserId(e.target.value)}
            className="w-full bg-background border border-border/60 py-1 px-2 text-[11px] font-mono text-foreground outline-none cursor-pointer"
          >
            <option value="">Select User...</option>
            {operators.map((u) => (
              <option key={u.id} value={u.id}>
                {u.full_name} ({u.email})
              </option>
            ))}
          </select>

          <select
            value={assignRoleId}
            onChange={(e) => setAssignRoleId(e.target.value)}
            disabled={!assignUserId}
            className="w-full bg-background border border-border/60 py-1 px-2 text-[11px] font-mono text-foreground outline-none cursor-pointer disabled:opacity-40"
          >
            <option value="">Select Role (Optional)...</option>
            {dept.roles?.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>

          <button
            type="submit"
            disabled={!assignUserId || assignUserM.isPending}
            className="w-full border border-foreground/15 py-1 text-[10px] uppercase tracking-[0.15em] font-medium text-foreground hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors disabled:opacity-30"
          >
            {assignUserM.isPending ? "Assigning..." : "Assign"}
          </button>
        </form>
      </div>
    </div>
  );
}

function RoleItem({
  role,
  onUpdate,
  onDelete,
}: {
  role: DepartmentRole;
  onUpdate: (name: string) => void;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [roleName, setRoleName] = useState(role.name);

  if (editing) {
    return (
      <li className="flex gap-2 items-center">
        <input
          value={roleName}
          onChange={(e) => setRoleName(e.target.value)}
          className="flex-1 border-b border-border bg-transparent py-0.5 text-[12px] font-mono text-foreground outline-none"
        />
        <button
          onClick={() => {
            if (roleName.trim()) {
              onUpdate(roleName.trim());
              setEditing(false);
            }
          }}
          className="text-[11px] font-mono text-[var(--accent)]"
        >
          [Save]
        </button>
        <button
          onClick={() => {
            setRoleName(role.name);
            setEditing(false);
          }}
          className="text-[11px] font-mono text-foreground/45"
        >
          [Cancel]
        </button>
      </li>
    );
  }

  return (
    <li className="flex justify-between items-center text-[12px] font-mono text-foreground/70">
      <span>{role.name}</span>
      <div className="flex gap-2">
        <button onClick={() => setEditing(true)} className="text-foreground/40 hover:text-foreground">[Edit]</button>
        <button onClick={onDelete} className="text-destructive/50 hover:text-destructive">[Delete]</button>
      </div>
    </li>
  );
}