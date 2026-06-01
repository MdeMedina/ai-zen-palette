import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { Upload } from "lucide-react";
import { brandsApi, knowledgeApi } from "@/lib/api";
import type { AssetType } from "@/lib/api/types";
import { PassivePulse } from "@/components/brand/PassivePulse";
import { PageHeader } from "./_app.hive";

export const Route = createFileRoute("/_app/knowledge")({
  head: () => ({ meta: [{ title: "PKGD OS · Knowledge Pipeline" }] }),
  component: KnowledgePage,
});

const TYPES: AssetType[] = ["SOP", "Dogma", "Gold", "Jewel"];

function KnowledgePage() {
  const qc = useQueryClient();
  const brandsQ = useQuery({ queryKey: ["brands"], queryFn: brandsApi.listBrands });
  const [brandId, setBrandId] = useState<string>("");
  const effectiveBrandId = brandId || brandsQ.data?.[0]?.id || "";

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

  return (
    <div className="flex h-screen flex-col">
      <PageHeader eyebrow="Administration" title="Knowledge Pipeline" />
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
            <div className="mt-2 grid grid-cols-4 gap-1">
              {TYPES.map((t) => (
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
              PDF · MD · TXT
            </div>
            <input
              ref={fileRef}
              type="file"
              hidden
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

        <section className="overflow-y-auto p-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-[15px] text-foreground/80">Repository</h2>
            <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-foreground/35">
              {listQ.data?.length ?? 0} indexed
            </span>
          </div>
          <div className="border border-foreground/5">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-foreground/5 text-[10px] uppercase tracking-[0.22em] text-foreground/40">
                  <th className="px-4 py-3 font-normal">Title</th>
                  <th className="px-4 py-3 font-normal">Type</th>
                  <th className="px-4 py-3 font-normal">Status</th>
                  <th className="px-4 py-3 font-normal">Created</th>
                </tr>
              </thead>
              <tbody>
                {listQ.data?.map((a) => (
                  <tr key={a.id} className="border-b border-foreground/5 text-[13px] last:border-0">
                    <td className="px-4 py-3 text-foreground">{a.title}</td>
                    <td className="px-4 py-3">
                      <span className="border border-foreground/15 px-2 py-0.5 text-[10px] uppercase tracking-[0.2em] text-foreground/70">
                        {a.asset_type}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <VectorStatus status={a.vectorization_status} />
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-foreground/40">
                      {new Date(a.created_at).toISOString().slice(0, 10)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}

function VectorStatus({ status }: { status: "Pending" | "Embedded" | "Error" }) {
  if (status === "Pending")
    return (
      <span className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-foreground/55">
        <PassivePulse /> Ingesting…
      </span>
    );
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