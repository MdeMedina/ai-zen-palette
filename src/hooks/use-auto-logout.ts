import { useEffect } from "react";
import { useSessionStore } from "@/stores/session";
import { getTokenExpMs } from "@/lib/auth/token";
import { forceLogout } from "@/lib/auth/logout";

/**
 * Proactively logs the user out the instant their JWT expires, without
 * waiting for the next API call to bounce with a 401. Re-arms whenever the
 * token changes (login / refresh). Tokens with no `exp` (mock/dev) are left
 * untouched.
 */
export function useAutoLogout(): void {
  const token = useSessionStore((s) => s.token);

  useEffect(() => {
    const exp = getTokenExpMs(token);
    if (exp === null) return;

    const remaining = exp - Date.now();
    if (remaining <= 0) {
      forceLogout({ expired: true });
      return;
    }

    // 24h tokens stay well under setTimeout's ~24.8-day (32-bit) ceiling.
    const id = setTimeout(() => forceLogout({ expired: true }), remaining);
    return () => clearTimeout(id);
  }, [token]);
}
