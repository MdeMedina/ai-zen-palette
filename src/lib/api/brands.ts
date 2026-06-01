import { USE_MOCKS, apiFetch, delay, mockId } from "./client";
import { mockBrands } from "./mocks/data";
import type { Brand, BrandStatus, UUID } from "./types";

/** GET /api/brands (mock-only for now). */
export async function listBrands(): Promise<Brand[]> {
  if (USE_MOCKS) {
    await delay(120);
    return mockBrands;
  }
  return apiFetch<Brand[]>("/api/brands");
}

export interface CreateBrandInput {
  name: string;
  industry: string;
  status?: BrandStatus;
}

/** POST /api/brands — admin only. */
export async function createBrand(input: CreateBrandInput): Promise<Brand> {
  if (USE_MOCKS) {
    await delay(220);
    const now = new Date().toISOString();
    const brand: Brand = {
      id: mockId(),
      name: input.name,
      industry: input.industry,
      status: input.status ?? "Active",
      created_at: now,
      updated_at: now,
    };
    mockBrands.unshift(brand);
    return brand;
  }
  return apiFetch<Brand>("/api/brands", { method: "POST", body: input });
}

export interface UpdateBrandInput {
  name?: string;
  industry?: string;
  status?: BrandStatus;
}

/** PATCH /api/brands/:id — admin only. */
export async function updateBrand(id: UUID, patch: UpdateBrandInput): Promise<Brand> {
  if (USE_MOCKS) {
    await delay(180);
    const b = mockBrands.find((x) => x.id === id);
    if (!b) throw Object.assign(new Error("Brand not found"), { status: 404 });
    if (patch.name !== undefined) b.name = patch.name;
    if (patch.industry !== undefined) b.industry = patch.industry;
    if (patch.status !== undefined) b.status = patch.status;
    b.updated_at = new Date().toISOString();
    return b;
  }
  return apiFetch<Brand>(`/api/brands/${id}`, { method: "PATCH", body: patch });
}

/** DELETE /api/brands/:id — admin only. */
export async function deleteBrand(id: UUID): Promise<void> {
  if (USE_MOCKS) {
    await delay(180);
    const idx = mockBrands.findIndex((x) => x.id === id);
    if (idx >= 0) mockBrands.splice(idx, 1);
    return;
  }
  await apiFetch<void>(`/api/brands/${id}`, { method: "DELETE" });
}