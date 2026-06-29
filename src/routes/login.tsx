import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { authApi } from "@/lib/api";
import { useSessionStore } from "@/stores/session";
import { useDeepLinkStore } from "@/stores/deep-link";
import { useHydrated } from "@/hooks/use-hydrated";
import { BrandLogo } from "@/components/brand/Logo";
import { PassivePulse } from "@/components/brand/PassivePulse";
import { PageBackground } from "@/components/brand/PageBackground";
import { useT } from "@/lib/i18n";

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
  const t = useT("login");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
      const target = consume() ?? "/oracle";
      navigate({ to: target as "/oracle", replace: true });
    } catch (err) {
      const status =
        err instanceof Error && "status" in err ? (err as { status?: number }).status : undefined;
      setError(status === 401 || status === 403 ? t.errAuth : t.errNetwork);
    } finally {
      setPending(false);
    }
  };

  return (
    <PageBackground>
      <div className="w-full max-w-[440px] px-6">
        <div className="mb-8 flex flex-col items-center gap-3">
          <BrandLogo />
          <p className="font-sans text-[10px] font-medium uppercase tracking-[0.1em] text-foreground/55">
            {t.gateway}
          </p>
        </div>

        <form onSubmit={onSubmit} className="border-double-thick bg-card p-8 shadow-xl">
          <Field label={t.emailLabel}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="operator@pkgd.os"
              autoComplete="email"
              autoFocus
              required
              className="w-full rounded-sm bg-transparent py-1.5 font-mono text-[14px] text-foreground outline-none placeholder:text-foreground/25"
            />
          </Field>

          <Field label={t.accessKeyLabel}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              autoComplete="current-password"
              required
              className="w-full rounded-sm bg-transparent py-1.5 font-mono text-[14px] tracking-[0.25em] text-foreground outline-none placeholder:text-foreground/25"
            />
          </Field>

          {error ? (
            <p role="alert" className="mt-4 text-sm text-destructive">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={pending}
            className={[
              "mt-6 inline-flex w-full items-center justify-between border border-[var(--accent)] px-5 py-3 text-sm font-medium text-foreground transition-all shadow-md active-press cursor-pointer",
              "hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)]",
              "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
              "disabled:cursor-default disabled:opacity-40",
            ].join(" ")}
          >
            <span>{pending ? t.initializing : t.initialize}</span>
            {pending ? (
              <PassivePulse />
            ) : (
              <span className="font-mono text-[10px] opacity-60">›</span>
            )}
          </button>

          <p role="status" className="sr-only">
            {pending ? t.srInitializing : hydrated && token ? t.srGranted : ""}
          </p>
        </form>

        <div className="mt-6 flex items-center justify-between text-xs">
          <a
            href="mailto:ops@pkgd.os?subject=Access%20key%20recovery"
            className="text-foreground/55 underline-offset-4 transition-colors hover:text-[var(--accent)] hover:underline"
          >
            {t.forgotKey}
          </a>
          <a
            href="mailto:support@pkgd.os"
            className="text-foreground/55 underline-offset-4 transition-colors hover:text-[var(--accent)] hover:underline"
          >
            {t.needHelp}
          </a>
        </div>

        <p className="mt-6 text-center font-mono text-[10px] uppercase tracking-[0.32em] text-foreground/55">
          {t.restricted}
        </p>
      </div>
    </PageBackground>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block py-2">
      <span className="mb-1 block font-sans text-[10px] font-semibold uppercase tracking-[0.1em] text-foreground/50">
        {label}
      </span>
      <div className="flex items-center gap-1 border border-border bg-foreground/[0.01] px-2 focus-within:border-[var(--accent)] transition-colors shadow-sm rounded-[3px]">
        <span className="font-mono text-foreground/30 select-none text-[13px] pr-1">[</span>
        <div className="flex-1 min-w-0">{children}</div>
        <span className="font-mono text-foreground/30 select-none text-[13px] pl-1">]</span>
      </div>
    </label>
  );
}
