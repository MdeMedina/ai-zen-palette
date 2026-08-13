import { USE_MOCKS, BASE_URL, apiFetch, delay } from "./client";
import type {
  DriveFile,
  DriveFileVersion,
  DriveFolder,
  DriveTree,
  DriveVersionHistory,
  UUID,
} from "./types";

/** Empty tree used as a graceful fallback in mock mode (feature targets the real backend). */
const emptyTree = (): DriveTree => ({
  brand_id: null,
  folder_count: 0,
  file_count: 0,
  tree: { folders: [], files: [] },
});

/** GET /api/drive/tree — the whole unified folder/file map (the UI navigates it in-memory). */
export async function getTree(): Promise<DriveTree> {
  if (USE_MOCKS) {
    await delay(120);
    return emptyTree();
  }
  return apiFetch<DriveTree>(`/api/drive/tree`);
}

export interface CreateFolderInput {
  name: string;
  parent_id?: UUID | null;
  /** OPTIONAL related brand. Omit → backend relates it to PKGD. */
  brand_id?: UUID | null;
}

/** POST /api/drive/folders */
export async function createFolder(input: CreateFolderInput): Promise<DriveFolder> {
  if (USE_MOCKS) {
    await delay(200);
    throw new Error("El Drive requiere el backend real (mocks desactivados).");
  }
  return apiFetch<DriveFolder>("/api/drive/folders", {
    method: "POST",
    body: {
      name: input.name,
      parent_id: input.parent_id ?? null,
      // Only send brand_id when explicitly chosen; otherwise the backend defaults to PKGD.
      ...(input.brand_id ? { brand_id: input.brand_id } : {}),
    },
  });
}

/**
 * PATCH /api/drive/folders/:id — rename, move and/or re-brand. Changing brand_id cascades
 * the new related brand to descendants that were inheriting the old one.
 */
export async function updateFolder(
  id: UUID,
  patch: { name?: string; parent_id?: UUID | null; brand_id?: UUID | null },
): Promise<DriveFolder> {
  return apiFetch<DriveFolder>(`/api/drive/folders/${id}`, { method: "PATCH", body: patch });
}

/** DELETE /api/drive/folders/:id — cascades subtree + files. */
export async function deleteFolder(id: UUID): Promise<void> {
  return apiFetch<void>(`/api/drive/folders/${id}`, { method: "DELETE" });
}

export interface UploadInput {
  file: File;
  folder_id?: UUID | null;
  /** Jerarquía ante el agente. Default NORMAL. RECTOR = siempre en contexto de su marca. */
  doc_tier?: "RECTOR" | "NORMAL";
}

/**
 * POST /api/drive/upload — multipart; backend persists the file and notifies n8n for
 * vectorization. The file's related brand is inherited from its folder (PKGD at root).
 */
export async function uploadFile(input: UploadInput): Promise<DriveFile> {
  if (USE_MOCKS) {
    await delay(400);
    throw new Error("El Drive requiere el backend real (mocks desactivados).");
  }
  const fd = new FormData();
  fd.append("file", input.file);
  if (input.folder_id) fd.append("folder_id", input.folder_id);
  if (input.doc_tier === "RECTOR") fd.append("doc_tier", "RECTOR");
  return apiFetch<DriveFile>("/api/drive/upload", { method: "POST", body: fd });
}

/** PATCH /api/drive/files/:id — rename and/or move. */
export async function updateFile(
  id: UUID,
  patch: { name?: string; folder_id?: UUID | null },
): Promise<DriveFile> {
  return apiFetch<DriveFile>(`/api/drive/files/${id}`, { method: "PATCH", body: patch });
}

/**
 * PATCH /api/drive/files/:id/tier — cambia la jerarquía Rector/Normal (metadato del agente).
 * Permitido también en archivos espejados de Dropbox (no muta nada en Dropbox).
 */
export async function setFileTier(
  id: UUID,
  doc_tier: "RECTOR" | "NORMAL",
): Promise<{ id: UUID; doc_tier: "RECTOR" | "NORMAL" }> {
  return apiFetch<{ id: UUID; doc_tier: "RECTOR" | "NORMAL" }>(`/api/drive/files/${id}/tier`, {
    method: "PATCH",
    body: { doc_tier },
  });
}

/** DELETE /api/drive/files/:id — removes row (cascades chunks) + physical file. */
export async function deleteFile(id: UUID): Promise<void> {
  return apiFetch<void>(`/api/drive/files/${id}`, { method: "DELETE" });
}

/** Office formats the backend can turn into HTML via Tika (docx, xlsx, pptx, odt, rtf…). */
const CONVERTIBLE_MIMES = new Set([
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.ms-powerpoint",
  "application/vnd.oasis.opendocument.text",
  "application/vnd.oasis.opendocument.spreadsheet",
  "application/vnd.oasis.opendocument.presentation",
  "application/rtf",
  "text/rtf",
  "application/epub+zip",
]);
const CONVERTIBLE_EXTS =
  /\.(docx?|xlsx?|pptx?|odt|ods|odp|rtf|epub)$/i;

/** Mirrors the backend's allowlist so we only ask for a preview that can exist. */
export function isConvertible(mime: string, name: string): boolean {
  return CONVERTIBLE_MIMES.has(mime) || CONVERTIBLE_EXTS.test(name);
}

/**
 * GET /api/drive/files/:id/preview[?version=…] — sanitized HTML rendering of an office
 * document. Without a version it renders the current one.
 */
export async function getPreviewHtml(id: UUID, versionId?: UUID | null): Promise<string> {
  const qs = versionId ? `?version=${versionId}` : "";
  const { html } = await apiFetch<{ id: UUID; html: string }>(`/api/drive/files/${id}/preview${qs}`);
  return html;
}

/* ---------- versions ---------- */

/** GET /api/drive/files/:id/versions — history, newest first. */
export async function getVersions(id: UUID): Promise<DriveVersionHistory> {
  return apiFetch<DriveVersionHistory>(`/api/drive/files/${id}/versions`);
}

/**
 * POST /api/drive/files/:id/versions — upload a new version of an existing file. It becomes
 * the current one (so it is what previews and what the agent searches); nothing is deleted.
 */
export async function uploadVersion(
  id: UUID,
  file: File,
  note?: string,
): Promise<{ file: DriveFile; version: DriveFileVersion }> {
  const fd = new FormData();
  fd.append("file", file);
  if (note?.trim()) fd.append("note", note.trim());
  return apiFetch<{ file: DriveFile; version: DriveFileVersion }>(
    `/api/drive/files/${id}/versions`,
    { method: "POST", body: fd },
  );
}

/** POST …/versions/:versionId/current — go back (or forward) to a version. Non-destructive. */
export async function restoreVersion(
  id: UUID,
  versionId: UUID,
): Promise<{ file: DriveFile; version: DriveFileVersion }> {
  return apiFetch<{ file: DriveFile; version: DriveFileVersion }>(
    `/api/drive/files/${id}/versions/${versionId}/current`,
    { method: "POST" },
  );
}

/** DELETE …/versions/:versionId — prunes one point of the history (never the current one). */
export async function deleteVersion(id: UUID, versionId: UUID): Promise<void> {
  return apiFetch<void>(`/api/drive/files/${id}/versions/${versionId}`, { method: "DELETE" });
}

/** Absolute URL for a stored file (for <img>/<iframe>/text fetch). Handles same-origin ("") base. */
export function fileUrl(relativeUrl: string): string {
  return `${BASE_URL}${relativeUrl}`;
}

/** Fetches a plain-text/markdown file's content for the preview modal. */
export async function fetchText(relativeUrl: string): Promise<string> {
  const res = await fetch(fileUrl(relativeUrl));
  if (!res.ok) throw new Error(`No se pudo leer el archivo (${res.status})`);
  return res.text();
}
