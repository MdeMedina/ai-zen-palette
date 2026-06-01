import { USE_MOCKS, apiFetch, delay, mockId } from "./client";
import { mockBrands, mockUserBrands, mockUsers } from "./mocks/data";
import type { GlobalRole, User, UUID } from "./types";

export interface OperatorRow extends User {
  brand_ids: UUID[];
}

/** GET /api/users — admin only; friction/calcification exposed here. */
export async function listOperators(): Promise<OperatorRow[]> {
  if (USE_MOCKS) {
    await delay(220);
    return mockUsers.map((u) => ({
      ...u,
      brand_ids: mockUserBrands[u.id] ?? [],
    }));
  }
  return apiFetch<OperatorRow[]>("/api/users");
}

export interface CreateOperatorInput {
  full_name: string;
  email: string;
  password: string;
  global_role: GlobalRole;
  brand_ids: UUID[];
}

/** POST /api/users — admin only. Initializes session_token_n8n on the backend. */
export async function createOperator(input: CreateOperatorInput): Promise<OperatorRow> {
  if (USE_MOCKS) {
    await delay(360);
    const now = new Date().toISOString();
    const created: User = {
      id: mockId(),
      full_name: input.full_name,
      email: input.email,
      password_hash: `mock_hash:${input.password}`,
      global_role: input.global_role,
      friction_level: 0,
      calcification_level: 0,
      created_at: now,
      updated_at: now,
    };
    mockUsers.push(created);
    mockUserBrands[created.id] = input.brand_ids;
    return { ...created, brand_ids: input.brand_ids };
  }
  return apiFetch<OperatorRow>("/api/users", { method: "POST", body: input });
}

/** PATCH /api/users/:id/role */
export async function updateRole(id: UUID, role: GlobalRole): Promise<void> {
  if (USE_MOCKS) {
    await delay(140);
    const u = mockUsers.find((x) => x.id === id);
    if (u) u.global_role = role;
    return;
  }
  await apiFetch<void>(`/api/users/${id}/role`, { method: "PATCH", body: { role } });
}

/** PATCH /api/users/:id/brands */
export async function linkBrands(id: UUID, brand_ids: UUID[]): Promise<void> {
  if (USE_MOCKS) {
    await delay(140);
    mockUserBrands[id] = brand_ids;
    return;
  }
  await apiFetch<void>(`/api/users/${id}/brands`, { method: "PATCH", body: { brand_ids } });
}

export async function listBrandsForUser(id: UUID): Promise<UUID[]> {
  if (USE_MOCKS) {
    await delay(80);
    return mockUserBrands[id] ?? [];
  }
  return apiFetch<UUID[]>(`/api/users/${id}/brands`);
}

export async function _allBrandsForMock(): Promise<typeof mockBrands> {
  await delay(40);
  return mockBrands;
}