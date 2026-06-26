import { USE_MOCKS, BASE_URL, apiFetch, delay, mockId } from "./client";
import { mockKnowledge, mockDepartments } from "./mocks/data";
import type { AssetType, KnowledgeAsset, UUID } from "./types";
import { useSessionStore } from "@/stores/session";

/** GET /api/knowledge/:brand_id */
export async function listByBrand(brand_id: UUID): Promise<KnowledgeAsset[]> {
  if (USE_MOCKS) {
    await delay(180);
    return mockKnowledge.filter((k) => k.brand_id === brand_id);
  }
  return apiFetch<KnowledgeAsset[]>(`/api/knowledge/${brand_id}`);
}

/** GET /api/knowledge/department/:department_id */
export async function listByDepartment(department_id: UUID): Promise<KnowledgeAsset[]> {
  if (USE_MOCKS) {
    await delay(180);
    return mockKnowledge.filter((k) => k.department_id === department_id);
  }
  return apiFetch<KnowledgeAsset[]>(`/api/knowledge/department/${department_id}`);
}

export async function listAll(): Promise<KnowledgeAsset[]> {
  if (USE_MOCKS) {
    await delay(120);
    return mockKnowledge;
  }
  return apiFetch<KnowledgeAsset[]>(`/api/knowledge`);
}

/** GET /api/knowledge/external */
export async function listExternal(): Promise<KnowledgeAsset[]> {
  if (USE_MOCKS) {
    await delay(180);
    return mockKnowledge.filter((k) => k.asset_type === "External");
  }
  return apiFetch<KnowledgeAsset[]>("/api/knowledge/external");
}

export interface UploadInput {
  file: File;
  brand_id?: UUID;
  asset_type: AssetType;
  title: string;
  department_id?: UUID;
  department_role_id?: UUID;
}

/** POST /api/knowledge/upload — admin only. Multipart; Node notifies n8n. */
export async function upload(input: UploadInput): Promise<KnowledgeAsset> {
  if (USE_MOCKS) {
    await delay(640);
    const dept = input.department_id
      ? mockDepartments.find((d) => d.id === input.department_id)
      : null;
    const role =
      input.department_role_id && dept
        ? dept.roles?.find((r) => r.id === input.department_role_id)
        : null;
    const asset: KnowledgeAsset = {
      id: mockId(),
      brand_id: input.brand_id || null,
      title: input.title || input.file.name,
      asset_type: input.asset_type,
      status: "Active",
      source_file_url: `/mock/${input.file.name}`,
      pgvector_ref_id: null,
      vectorization_status: "Pending",
      department_id: input.department_id,
      department_role_id: input.department_role_id,
      department: dept ? { id: dept.id, name: dept.name } : null,
      department_role: role ? { id: role.id, name: role.name } : null,
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
  if (input.brand_id) fd.append("brand_id", input.brand_id);
  fd.append("asset_type", input.asset_type);
  fd.append("title", input.title);
  if (input.department_id) fd.append("department_id", input.department_id);
  if (input.department_role_id) fd.append("department_role_id", input.department_role_id);
  return apiFetch<KnowledgeAsset>("/api/knowledge/upload", { method: "POST", body: fd });
}

/**
 * POST /api/knowledge/session/:session_id/approve — admin only.
 * Approves the pending Gold PROPOSAL of a session: hands off to the n8n approval flow,
 * which promotes it to Active (entering the brand knowledge base) and generates the .docx.
 */
export async function approveSessionGold(
  session_id: UUID,
): Promise<{ ok: boolean; asset_id?: UUID; result?: unknown }> {
  if (USE_MOCKS) {
    await delay(320);
    return { ok: true };
  }
  return apiFetch(`/api/knowledge/session/${session_id}/approve`, {
    method: "POST",
  });
}

/**
 * GET /api/knowledge/proposals?type=Gold|Jewel&brand_id= — admin only.
 * Lists PENDING proposals (status='Proposed') awaiting approval.
 */
export async function listProposals(
  type?: "Gold" | "Jewel",
  brand_id?: UUID,
): Promise<KnowledgeAsset[]> {
  if (USE_MOCKS) {
    await delay(160);
    return mockKnowledge.filter(
      (k) =>
        (k.status as string) === "Proposed" &&
        (!type || k.asset_type === type) &&
        (!brand_id || k.brand_id === brand_id),
    );
  }
  const qs = new URLSearchParams();
  if (type) qs.set("type", type);
  if (brand_id) qs.set("brand_id", brand_id);
  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  return apiFetch<KnowledgeAsset[]>(`/api/knowledge/proposals${suffix}`);
}

/**
 * POST /api/knowledge/:id/approve — admin only.
 * Approves a pending proposal (Gold or Jewel): hands off to the n8n approval
 * flow, which promotes it to Active and generates the .docx.
 */
export async function approveProposal(
  id: UUID,
): Promise<{ ok: boolean; asset_id?: UUID; result?: unknown }> {
  if (USE_MOCKS) {
    await delay(300);
    const asset = mockKnowledge.find((k) => k.id === id);
    if (asset) (asset.status as string) = "Active";
    return { ok: true, asset_id: id };
  }
  return apiFetch(`/api/knowledge/${id}/approve`, { method: "POST" });
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

  const token = useSessionStore.getState().token;
  const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};
  const res = await fetch(`${BASE_URL}/api/knowledge/${asset.id}/download`, { headers });

  if (!res.ok) {
    throw new Error("Failed to download file");
  }

  const blob = await res.blob();
  if (typeof window === "undefined") return;
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;

  // Try to preserve original extension if possible
  const filename = asset.source_file_url ? asset.source_file_url.split("/").pop() || "" : "";
  const ext = filename.includes(".") ? filename.substring(filename.lastIndexOf(".")) : "";
  const downloadName = asset.title.endsWith(ext) ? asset.title : `${asset.title}${ext}`;

  a.download = downloadName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** DELETE /api/knowledge/:id */
export async function deleteAsset(id: UUID): Promise<void> {
  if (USE_MOCKS) {
    await delay(200);
    const index = mockKnowledge.findIndex((k) => k.id === id);
    if (index !== -1) mockKnowledge.splice(index, 1);
    return;
  }
  return apiFetch<void>(`/api/knowledge/${id}`, { method: "DELETE" });
}

/** PATCH /api/knowledge/:id/brand */
export async function updateBrand(id: UUID, brand_id: UUID): Promise<KnowledgeAsset> {
  if (USE_MOCKS) {
    await delay(200);
    const asset = mockKnowledge.find((k) => k.id === id);
    if (asset) asset.brand_id = brand_id;
    return asset!;
  }
  return apiFetch<KnowledgeAsset>(`/api/knowledge/${id}/brand`, {
    method: "PATCH",
    body: { brand_id },
  });
}
