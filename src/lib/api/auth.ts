import { USE_MOCKS, apiFetch, delay } from "./client";
import { mockUsers } from "./mocks/data";
import type { AuthResponse, User } from "./types";

export interface LoginInput {
  email: string;
  password: string;
}

/** POST /api/auth/login */
export async function login(input: LoginInput): Promise<AuthResponse> {
  if (USE_MOCKS) {
    await delay(420);
    const user = mockUsers.find((u) => u.email.toLowerCase() === input.email.toLowerCase());
    if (!user) {
      throw Object.assign(new Error("Unknown operator"), { status: 401 });
    }
    // Operator Blindness: backend DTO would purge these fields for operators.
    const purged: User =
      user.global_role === "operator"
        ? { ...user, friction_level: null, calcification_level: null }
        : user;
    return {
      token: `mock.jwt.${user.id}`,
      user: purged,
    };
  }
  return apiFetch<AuthResponse>("/api/auth/login", {
    method: "POST",
    body: input,
    anonymous: true,
  });
}

/** GET /api/users/me — DTO purges friction/calcification for operators. */
export async function me(): Promise<User> {
  if (USE_MOCKS) {
    await delay(150);
    const u = mockUsers[0];
    return { ...u };
  }
  return apiFetch<User>("/api/users/me");
}

/** Client-side helper. Real logout endpoint is optional. */
export async function logout(): Promise<void> {
  if (USE_MOCKS) {
    await delay(80);
    return;
  }
  try {
    await apiFetch<void>("/api/auth/logout", { method: "POST" });
  } catch {
    /* swallow — token is cleared locally either way */
  }
}
