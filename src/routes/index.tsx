import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useSessionStore } from "@/stores/session";
import { useHydrated } from "@/hooks/use-hydrated";
import { BrandLogo } from "@/components/brand/Logo";
import { PageBackground } from "@/components/brand/PageBackground";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    // If we're on the client side, check localStorage to avoid mounting
    // the splash gate and immediately redirect if we already have the token.
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("pkgd-session");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed?.state?.token) {
            throw redirect({ to: "/oracle", replace: true });
          } else {
            throw redirect({ to: "/login", replace: true });
          }
        }
      } catch (e) {
        // Fallback to client-side component redirect if anything fails
      }
    }
  },
  head: () => ({
    meta: [
      { title: "PKGD OS · Initialize" },
      { name: "description", content: "PKGD OS — Espacio de Conversación." },
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
    <PageBackground>
      <div className="flex flex-col items-center gap-6">
        <div
          className={`flex items-center gap-3 text-foreground/45 transition-all duration-700 ${
            !hydrated ? "animate-pulse scale-[1.02]" : "opacity-0"
          }`}
        >
          <BrandLogo />
        </div>
        
        {!hydrated && (
          <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.24em] text-foreground/35 animate-fade-in">
            <span>Initializing core</span>
            <span className="inline-flex gap-0.5">
              <span className="size-[3px] rounded-full bg-[var(--accent)] animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="size-[3px] rounded-full bg-[var(--accent)] animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="size-[3px] rounded-full bg-[var(--accent)] animate-bounce" style={{ animationDelay: "300ms" }} />
            </span>
          </div>
        )}
      </div>
    </PageBackground>
  );
}

