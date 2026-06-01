import { USE_MOCKS, apiFetch, delay } from "./client";
import { mockBrands } from "./mocks/data";
import type { Brand } from "./types";

/** GET /api/brands (mock-only for now). */
export async function listBrands(): Promise<Brand[]> {
  if (USE_MOCKS) {
    await delay(120);
    return mockBrands;
  }
  return apiFetch<Brand[]>("/api/brands");
}