import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useSessionStore } from "@/stores/session";
import { useHydrated } from "@/hooks/use-hydrated";
import { BrandLogo } from "@/components/brand/Logo";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PKGD OS · Initialize" },
      { name: "description", content: "PKGD OS — The Oracle Workspace." },
    ],
  }),
  component: IndexGate,
});

function IndexGate() {
  const hydrated = useHydrated();
  const token = useSessionStore((s) => s.token);
  const navigate = useNavigate();

  useEffect(() => {
    if (!hydrated) return;
    navigate({ to: token ? "/oracle" : "/login", replace: true });
  }, [hydrated, token, navigate]);

  return (
    <div className="grid min-h-screen place-items-center bg-background grid-bg">
      <div className="flex items-center gap-3 text-foreground/40">
        <BrandLogo />
      </div>
    </div>
  );
}
