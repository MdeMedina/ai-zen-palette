import { USE_MOCKS, apiFetch, delay, mockId } from "./client";
import { mockDepartments } from "./mocks/data";
import type { Department, DepartmentRole, UUID } from "./types";

export async function listDepartments(): Promise<Department[]> {
  if (USE_MOCKS) {
    await delay(120);
    return mockDepartments;
  }
  return apiFetch<Department[]>("/api/departments");
}

export async function createDepartment(name: string): Promise<Department> {
  if (USE_MOCKS) {
    await delay(180);
    const dept: Department = {
      id: mockId(),
      name,
      roles: [],
    };
    mockDepartments.push(dept);
    return dept;
  }
  return apiFetch<Department>("/api/departments", {
    method: "POST",
    body: { name },
  });
}

export async function updateDepartment(id: UUID, name: string): Promise<Department> {
  if (USE_MOCKS) {
    await delay(180);
    const dept = mockDepartments.find((d) => d.id === id);
    if (!dept) throw Object.assign(new Error("Department not found"), { status: 404 });
    dept.name = name;
    return dept;
  }
  return apiFetch<Department>(`/api/departments/${id}`, {
    method: "PATCH",
    body: { name },
  });
}

export async function deleteDepartment(id: UUID): Promise<void> {
  if (USE_MOCKS) {
    await delay(180);
    const idx = mockDepartments.findIndex((d) => d.id === id);
    if (idx >= 0) mockDepartments.splice(idx, 1);
    return;
  }
  await apiFetch<void>(`/api/departments/${id}`, { method: "DELETE" });
}

export async function createRole(departmentId: UUID, name: string): Promise<DepartmentRole> {
  if (USE_MOCKS) {
    await delay(180);
    const dept = mockDepartments.find((d) => d.id === departmentId);
    if (!dept) throw Object.assign(new Error("Department not found"), { status: 404 });
    const role: DepartmentRole = {
      id: mockId(),
      name,
      department_id: departmentId,
    };
    if (!dept.roles) dept.roles = [];
    dept.roles.push(role);
    return role;
  }
  return apiFetch<DepartmentRole>(`/api/departments/${departmentId}/roles`, {
    method: "POST",
    body: { name },
  });
}

export async function updateRole(departmentId: UUID, id: UUID, name: string): Promise<DepartmentRole> {
  if (USE_MOCKS) {
    await delay(180);
    const dept = mockDepartments.find((d) => d.id === departmentId);
    if (!dept) throw Object.assign(new Error("Department not found"), { status: 404 });
    const role = dept.roles?.find((r) => r.id === id);
    if (!role) throw Object.assign(new Error("Role not found"), { status: 404 });
    role.name = name;
    return role;
  }
  return apiFetch<DepartmentRole>(`/api/departments/${departmentId}/roles/${id}`, {
    method: "PATCH",
    body: { name },
  });
}

export async function deleteRole(departmentId: UUID, id: UUID): Promise<void> {
  if (USE_MOCKS) {
    await delay(180);
    const dept = mockDepartments.find((d) => d.id === departmentId);
    if (!dept) throw Object.assign(new Error("Department not found"), { status: 404 });
    if (dept.roles) {
      const idx = dept.roles.findIndex((r) => r.id === id);
      if (idx >= 0) dept.roles.splice(idx, 1);
    }
    return;
  }
  await apiFetch<void>(`/api/departments/${departmentId}/roles/${id}`, { method: "DELETE" });
}
