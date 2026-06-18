import { USE_MOCKS, apiFetch, delay, mockId } from "./client";
import { mockBrands, mockSessions, mockUserBrands, mockUsers, mockDepartments } from "./mocks/data";
import type {
  GlobalRole,
  OperatorDiagnostic,
  User,
  UUID,
} from "./types";

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
  department_id?: UUID;
  department_role_id?: UUID;
}

/** POST /api/users — admin only. Initializes session_token_n8n on the backend. */
export async function createOperator(input: CreateOperatorInput): Promise<OperatorRow> {
  if (USE_MOCKS) {
    await delay(360);
    const now = new Date().toISOString();
    const dept = input.department_id ? mockDepartments.find((d) => d.id === input.department_id) : null;
    const role = input.department_role_id && dept ? dept.roles?.find((r) => r.id === input.department_role_id) : null;

    const created: User = {
      id: mockId(),
      full_name: input.full_name,
      email: input.email,
      password_hash: `mock_hash:${input.password}`,
      global_role: input.global_role,
      friction_level: 0,
      calcification_level: 0,
      brand_access: input.brand_ids,
      department_id: input.department_id,
      department_role_id: input.department_role_id,
      department: dept ? { id: dept.id, name: dept.name } : null,
      department_role: role ? { id: role.id, name: role.name } : null,
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

export interface UpdateOperatorInput {
  full_name?: string;
  email?: string;
  global_role?: GlobalRole;
  brand_ids?: UUID[];
  department_id?: UUID | null;
  department_role_id?: UUID | null;
}

/** PATCH /api/users/:id */
export async function updateOperator(
  id: UUID,
  patch: UpdateOperatorInput,
): Promise<OperatorRow> {
  if (USE_MOCKS) {
    await delay(220);
    const u = mockUsers.find((x) => x.id === id);
    if (!u) throw Object.assign(new Error("User not found"), { status: 404 });
    if (patch.full_name !== undefined) u.full_name = patch.full_name;
    if (patch.email !== undefined) u.email = patch.email;
    if (patch.global_role !== undefined) u.global_role = patch.global_role;
    if (patch.brand_ids !== undefined) {
      mockUserBrands[id] = patch.brand_ids;
      u.brand_access = patch.brand_ids;
    }
    if (patch.department_id !== undefined) {
      u.department_id = patch.department_id;
      const dept = patch.department_id ? mockDepartments.find((d) => d.id === patch.department_id) : null;
      u.department = dept ? { id: dept.id, name: dept.name } : null;
    }
    if (patch.department_role_id !== undefined) {
      u.department_role_id = patch.department_role_id;
      const dept = u.department_id ? mockDepartments.find((d) => d.id === u.department_id) : null;
      const role = patch.department_role_id && dept ? dept.roles?.find((r) => r.id === patch.department_role_id) : null;
      u.department_role = role ? { id: role.id, name: role.name } : null;
    }
    u.updated_at = new Date().toISOString();
    return { ...u, brand_ids: mockUserBrands[id] ?? [] };
  }
  return apiFetch<OperatorRow>(`/api/users/${id}`, { method: "PATCH", body: patch });
}

/** DELETE /api/users/:id */
export async function deleteOperator(id: UUID): Promise<void> {
  if (USE_MOCKS) {
    await delay(220);
    const idx = mockUsers.findIndex((x) => x.id === id);
    if (idx >= 0) mockUsers.splice(idx, 1);
    delete mockUserBrands[id];
    return;
  }
  await apiFetch<void>(`/api/users/${id}`, { method: "DELETE" });
}

/**
 * GET /api/users/:id/diagnostic — backend-computed operational diagnostic
 * for an operator. Mock derives a deterministic narrative from the
 * operator's sessions so the UI can be reviewed end-to-end.
 */
export async function getOperatorDiagnostic(id: UUID): Promise<OperatorDiagnostic> {
  if (USE_MOCKS) {
    await delay(180);
    const sessions = mockSessions.filter((s) => s.user_id === id);
    const max_friction = sessions.reduce((m, s) => Math.max(m, s.friction_level), 0);
    const encauzamiento_count = sessions.reduce((m, s) => m + s.encauzamiento_count, 0);
    const glitches = sessions.flatMap((s) => s.glitches);
    const coupling_node_count = sessions.filter((s) => s.coupling_node_triggered).length;
    const score =
      glitches.length === 0
        ? 6
        : Math.round(
            (glitches.reduce((sum, g) => sum + g.score, 0) / glitches.length) * 10,
          ) / 10;
    const text = renderDiagnostic({
      max_friction,
      encauzamiento_count,
      coupling_node_count,
      score,
    });
    return {
      text,
      score,
      max_friction,
      encauzamiento_count,
      glitch_count: glitches.length,
      coupling_node_count,
      glitches,
    };
  }
  return apiFetch<OperatorDiagnostic>(`/api/users/${id}/diagnostic`);
}

function renderDiagnostic(d: {
  max_friction: number;
  encauzamiento_count: number;
  coupling_node_count: number;
  score: number;
}): string {
  if (d.encauzamiento_count >= 3 && d.score >= 5) {
    return "Operador en encauzamiento sostenido. Capacidad demostrada de cortar el bucle defensivo y nombrar la variable. Apto para extracción de Oro Estructural.";
  }
  if (d.max_friction >= 7 && d.score < 5) {
    return "Alta fricción con baja resolución. El operador resiste el corte; predominan glitches sin reformulación. Intervenir antes de calcificar.";
  }
  if (d.coupling_node_count > 0) {
    return "Nodo de acoplamiento activo. La conversación tocó estructura. Monitorear si el próximo intervalo produce encauzamiento.";
  }
  return "Operación estable. Fricción dentro de rango, sin glitches críticos. Sin acción requerida.";
}

// Ensure mock array consumer (silences unused-import in strict builds).
void mockUserBrands;