import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { authApi } from "@/lib/api";
import { useSessionStore } from "@/stores/session";
import { BrandLogo } from "@/components/brand/Logo";
import { PassivePulse } from "@/components/brand/PassivePulse";
import { PageBackground } from "@/components/brand/PageBackground";

const searchSchema = z.object({
  token: z.string().optional(),
});

export const Route = createFileRoute("/set-password")({
  head: () => ({
    meta: [{ title: "PKGD OS · Activación de Cuenta" }],
  }),
  validateSearch: searchSchema,
  component: SetPasswordPage,
});

type TokenState = "checking" | "valid" | "invalid";

function SetPasswordPage() {
  const navigate = useNavigate();
  const search = useSearch({ from: "/set-password" });
  const setSession = useSessionStore((s) => s.setSession);
  const token = search.token ?? "";

  const [tokenState, setTokenState] = useState<TokenState>("checking");
  const [accountEmail, setAccountEmail] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Validar el token al montar para mostrar a quién pertenece la cuenta.
  useEffect(() => {
    let active = true;
    if (!token) {
      setTokenState("invalid");
      return;
    }
    authApi
      .validateActivation(token)
      .then((info) => {
        if (!active) return;
        setAccountEmail(info.email);
        setTokenState("valid");
      })
      .catch(() => {
        if (!active) return;
        setTokenState("invalid");
      });
    return () => {
      active = false;
    };
  }, [token]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (password !== confirm) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setPending(true);
    try {
      const { token: jwt, user } = await authApi.setPassword({ token, password });
      setSession(jwt, user);
      navigate({ to: "/oracle", replace: true });
    } catch (err) {
      const status =
        err instanceof Error && "status" in err ? (err as { status?: number }).status : undefined;
      setError(
        status === 410
          ? "Este enlace expiró. Solicita uno nuevo a tu administrador."
          : status === 400
            ? "Enlace de activación inválido o ya utilizado."
            : "No se pudo completar la activación. Intenta de nuevo.",
      );
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
            Activación de cuenta
          </p>
        </div>

        <div className="border-double-thick bg-card p-8 shadow-xl">
          {tokenState === "checking" ? (
            <div className="flex items-center justify-center gap-3 py-8">
              <PassivePulse />
              <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-foreground/55">
                Verificando enlace…
              </span>
            </div>
          ) : tokenState === "invalid" ? (
            <div className="py-4">
              <p className="text-sm text-destructive">
                Este enlace de activación es inválido o ya expiró.
              </p>
              <p className="mt-3 text-xs text-foreground/55">
                Pide a tu administrador que te reenvíe la invitación.
              </p>
            </div>
          ) : (
            <form onSubmit={onSubmit}>
              {accountEmail ? (
                <p className="mb-5 font-mono text-[12px] text-foreground/70">
                  {accountEmail}
                </p>
              ) : null}

              <Field label="Nueva contraseña">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  autoComplete="new-password"
                  autoFocus
                  required
                  className="w-full rounded-sm bg-transparent py-1.5 font-mono text-[14px] tracking-[0.25em] text-foreground outline-none placeholder:text-foreground/25"
                />
              </Field>

              <Field label="Confirmar contraseña">
                <input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="••••••••••••"
                  autoComplete="new-password"
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
                <span>{pending ? "Activando…" : "Activar y entrar"}</span>
                {pending ? (
                  <PassivePulse />
                ) : (
                  <span className="font-mono text-[10px] opacity-60">›</span>
                )}
              </button>
            </form>
          )}
        </div>

        <p className="mt-6 text-center font-mono text-[10px] uppercase tracking-[0.32em] text-foreground/55">
          Acceso restringido
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
