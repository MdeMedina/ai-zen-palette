import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { authApi } from "@/lib/api";
import { useSessionStore } from "@/stores/session";
import { useDeepLinkStore } from "@/stores/deep-link";
import { useHydrated } from "@/hooks/use-hydrated";
import { BrandLogo } from "@/components/brand/Logo";

const searchSchema = z.object({
  alert: z.string().optional(),
  session: z.string().optional(),
  next: z.string().optional(),
});

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [{ title: "PKGD OS · Authentication Gateway" }],
  }),
  validateSearch: searchSchema,
  component: LoginPage,
});

function LoginPage() {
  const hydrated = useHydrated();
  const navigate = useNavigate();
  const search = useSearch({ from: "/login" });
  const setSession = useSessionStore((s) => s.setSession);
  const token = useSessionStore((s) => s.token);
  const capture = useDeepLinkStore((s) => s.capture);
  const consume = useDeepLinkStore((s) => s.consume);

  const [email, setEmail] = useState("admin@pkgd.os");
  const [password, setPassword] = useState("•••••");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Deep-link interceptor: persist target before login.
  useEffect(() => {
    if (search.alert === "structural_gold" && search.session) {
      capture(`/audit?alert=structural_gold&session=${search.session}`);
    } else if (search.next) {
      capture(search.next);
    }
  }, [search, capture]);

  useEffect(() => {
    if (!hydrated || !token) return;
    const target = consume() ?? "/oracle";
    navigate({ to: target as "/oracle", replace: true });
  }, [hydrated, token, navigate, consume]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPending(true);
    setError(null);
    try {
      const { token, user } = await authApi.login({ email, password });
      setSession(token, user);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Initialization rejected");
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden bg-background">
      <div aria-hidden className="pointer-events-none absolute inset-0 grid-bg opacity-60" />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 size-[640px] -translate-x-1/2 rounded-full"
        style={{ background: "radial-gradient(circle, color-mix(in oklab, var(--accent) 14%, transparent), transparent 60%)" }}
      />

      <div className="relative z-10 w-full max-w-[440px] px-6">
        <div className="mb-8 flex flex-col items-center gap-3">
          <BrandLogo />
          <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-foreground/40">
            Authentication Gateway
          </p>
        </div>

        <form
          onSubmit={onSubmit}
          className="relative border border-foreground/10 bg-[var(--card)]/60 p-8 backdrop-blur-md transition-shadow"
          style={{ boxShadow: "var(--shadow-elegant)" }}
        >
          <div
            aria-hidden
            className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-[var(--accent)] to-transparent opacity-60"
          />

          <Field label="Corporate Email / Operator ID">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="operator@pkgd.os"
              autoComplete="email"
              required
              className="w-full bg-transparent py-2 font-mono text-[14px] text-foreground outline-none placeholder:text-foreground/25"
            />
          </Field>

          <div className="h-px bg-foreground/5" />

          <Field label="Access Key">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              autoComplete="current-password"
              required
              className="w-full bg-transparent py-2 font-mono text-[14px] tracking-[0.2em] text-foreground outline-none placeholder:text-foreground/25"
            />
          </Field>

          {error ? (
            <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.22em] text-destructive">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={pending}
            className={[
              "mt-8 inline-flex w-full items-center justify-between border border-[var(--accent)] px-5 py-3 text-[12px] uppercase tracking-[0.28em] text-foreground transition-all",
              "hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)]",
              "disabled:cursor-default disabled:opacity-40",
            ].join(" ")}
            style={pending ? {} : { boxShadow: "var(--glow-soft)" }}
          >
            <span>Initialize Session</span>
            <span className="font-mono text-[10px] opacity-60">›</span>
          </button>
        </form>

        <p className="mt-6 text-center font-mono text-[10px] uppercase tracking-[0.32em] text-foreground/30">
          PKGD OS · v0.1 · Restricted Access
        </p>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block py-3">
      <span className="mb-1 block font-mono text-[10px] uppercase tracking-[0.28em] text-foreground/45">
        {label}
      </span>
      {children}
    </label>
  );
}