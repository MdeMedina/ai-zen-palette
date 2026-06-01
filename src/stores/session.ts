import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type GlobalRole = "admin" | "operator";

export interface SessionUser {
  id: string;
  full_name: string;
  email: string;
  password_hash?: string;
  global_role: GlobalRole;
  /**
   * Telemetry — purged by backend DTO for operators (Operator Blindness).
   * Present only when `global_role === "admin"` reads from /api/users/me
   * or when admin lists operators via /api/users.
   */
  friction_level?: number | null;
  calcification_level?: number | null;
  /** Brand access list (empty for admins). */
  brand_access?: string[];
}

export type ChatLanguage = "en" | "es";

interface SessionState {
  token: string | null;
  user: SessionUser | null;
  chatLanguage: ChatLanguage;
  setSession: (token: string, user: SessionUser) => void;
  setUser: (user: SessionUser) => void;
  setLanguage: (lang: ChatLanguage) => void;
  clear: () => void;
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      chatLanguage: "en",
      setSession: (token, user) => set({ token, user }),
      setUser: (user) => set({ user }),
      setLanguage: (chatLanguage) => set({ chatLanguage }),
      clear: () => set({ token: null, user: null }),
    }),
    {
      name: "pkgd-session",
      storage: createJSONStorage(() =>
        typeof window !== "undefined" ? window.localStorage : (undefined as never),
      ),
      partialize: (s) => ({ token: s.token, user: s.user, chatLanguage: s.chatLanguage }),
    },
  ),
);

export const isAdmin = (u: SessionUser | null): boolean => u?.global_role === "admin";