import { toast } from "sonner";
import { useSessionStore } from "@/stores/session";

/**
 * Clear the local session. The `/_app` layout reacts to `token === null`
 * and redirects to `/login` (capturing the current path as a deep link),
 * so no router instance is needed here.
 *
 * Idempotent: a no-op once the token is already gone, which also dedupes
 * the toast when the proactive timer and a 401 response fire together.
 */
export function forceLogout(opts: { expired?: boolean } = {}): void {
  if (!useSessionStore.getState().token) return;
  useSessionStore.getState().clear();
  if (opts.expired) {
    toast("Tu sesión ha expirado", {
      description: "Vuelve a iniciar sesión para continuar.",
    });
  }
}
