import { USE_MOCKS, apiFetch, delay, mockId } from "./client";
import { mockKnowledge } from "./mocks/data";
import type { AssetType, KnowledgeAsset, UUID } from "./types";

/** GET /api/knowledge/:brand_id */
export async function listByBrand(brand_id: UUID): Promise<KnowledgeAsset[]> {
  if (USE_MOCKS) {
    await delay(180);
    return mockKnowledge.filter((k) => k.brand_id === brand_id);
  }
  return apiFetch<KnowledgeAsset[]>(`/api/knowledge/${brand_id}`);
}

export async function listAll(): Promise<KnowledgeAsset[]> {
  if (USE_MOCKS) {
    await delay(120);
    return mockKnowledge;
  }
  return apiFetch<KnowledgeAsset[]>(`/api/knowledge`);
}

export interface UploadInput {
  file: File;
  brand_id: UUID;
  asset_type: AssetType;
  title: string;
}

/** POST /api/knowledge/upload — admin only. Multipart; Node notifies n8n. */
export async function upload(input: UploadInput): Promise<KnowledgeAsset> {
  if (USE_MOCKS) {
    await delay(640);
    const asset: KnowledgeAsset = {
      id: mockId(),
      brand_id: input.brand_id,
      title: input.title || input.file.name,
      asset_type: input.asset_type,
      status: "Active",
      source_file_url: `/mock/${input.file.name}`,
      pgvector_ref_id: null,
      vectorization_status: "Pending",
      created_at: new Date().toISOString(),
    };
    mockKnowledge.unshift(asset);
    setTimeout(() => {
      asset.vectorization_status = "Embedded";
      asset.pgvector_ref_id = `pg_vec_${asset.id.slice(0, 6)}`;
    }, 6000);
    return asset;
  }

  const fd = new FormData();
  fd.append("file", input.file);
  fd.append("brand_id", input.brand_id);
  fd.append("asset_type", input.asset_type);
  fd.append("title", input.title);
  return apiFetch<KnowledgeAsset>("/api/knowledge/upload", { method: "POST", body: fd });
}

/** POST /api/knowledge/extract — admin only. */
export async function extractGold(session_id: UUID): Promise<{ ok: boolean }> {
  if (USE_MOCKS) {
    await delay(320);
    return { ok: true };
  }
  return apiFetch<{ ok: boolean }>("/api/knowledge/extract", {
    method: "POST",
    body: { session_id },
  });
}

/**
 * GET /api/knowledge/:id/download — streams the original source file.
 * In mock mode opens `source_file_url` in a new tab so the UX is still wired.
 */
export async function downloadAsset(asset: KnowledgeAsset): Promise<void> {
  if (USE_MOCKS) {
    await delay(80);
    if (typeof window !== "undefined" && asset.source_file_url) {
      window.open(asset.source_file_url, "_blank", "noopener,noreferrer");
    }
    return;
  }
  const blob = await apiFetch<Blob>(`/api/knowledge/${asset.id}/download`);
  if (typeof window === "undefined") return;
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = asset.title;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}