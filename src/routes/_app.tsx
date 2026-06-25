import { Outlet, createFileRoute, useNavigate, useLocation } from "@tanstack/react-router";
import { useEffect } from "react";
import { useSessionStore, isAdmin } from "@/stores/session";
import { useDeepLinkStore } from "@/stores/deep-link";
import { useHydrated } from "@/hooks/use-hydrated";
import { AppShell } from "@/components/brand/AppShell";

const ADMIN_ROUTES = ["/hive", "/knowledge", "/audit"];

export const Route = createFileRoute("/_app")({
  component: AppLayout,
});

function AppLayout() {
  const hydrated = useHydrated();
  const user = useSessionStore((s) => s.user);
  const token = useSessionStore((s) => s.token);
  const navigate = useNavigate();
  const loc = useLocation();
  const capture = useDeepLinkStore((s) => s.capture);

  useEffect(() => {
    if (!hydrated) return;
    if (!token || !user) {
      capture(loc.pathname + loc.searchStr);
      navigate({ to: "/login", replace: true });
      return;
    }
    if (!isAdmin(user) && ADMIN_ROUTES.some((r) => loc.pathname.startsWith(r))) {
      navigate({ to: "/oracle", replace: true });
    }
  }, [hydrated, token, user, loc.pathname, loc.searchStr, navigate, capture]);

  if (!hydrated || !token || !user) {
    return <div className="min-h-screen bg-background" />;
  }

  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}
