import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, X } from "lucide-react";
import { brandsApi, usersApi } from "@/lib/api";
import type { GlobalRole, UUID } from "@/lib/api/types";

export const Route = createFileRoute("/_app/hive")({
  head: () => ({ meta: [{ title: "PKGD OS · Hive Matrix" }] }),
  component: HivePage,
});

function HivePage() {
  const qc = useQueryClient();
  const operatorsQ = useQuery({ queryKey: ["operators"], queryFn: usersApi.listOperators });
  const brandsQ = useQuery({ queryKey: ["brands"], queryFn: brandsApi.listBrands });

  const [drawerOpen, setDrawerOpen] = useState(false);
  const createM = useMutation({
    mutationFn: usersApi.createOperator,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["operators"] });
      setDrawerOpen(false);
    },
  });

  return (
    <div className="flex h-screen flex-col">
      <PageHeader
        eyebrow="Administration"
        title="Hive Matrix"
        actions={
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="inline-flex items-center gap-2 border border-[var(--accent)] px-4 py-2 text-[11px] uppercase tracking-[0.24em] text-foreground transition-colors hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)]"
          >
            <Plus className="size-3.5" strokeWidth={2} />
            Register Operator
          </button>
        }
      />

      <div className="flex-1 overflow-auto px-8 py-6">
        <div className="border border-foreground/5">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-foreground/5 text-[10px] uppercase tracking-[0.22em] text-foreground/40">
                <Th>Operator</Th>
                <Th>Role</Th>
                <Th className="text-right">Friction</Th>
                <Th className="text-right">Calcification</Th>
                <Th>Brands</Th>
                <Th>Created</Th>
              </tr>
            </thead>
            <tbody>
              {operatorsQ.data?.map((o) => (
                <tr
                  key={o.id}
                  className="border-b border-foreground/5 text-[13px] last:border-0 hover:bg-foreground/[0.02]"
                >
                  <Td>
                    <div className="text-foreground">{o.full_name}</div>
                    <div className="font-mono text-[11px] text-foreground/40">{o.email}</div>
                  </Td>
                  <Td>
                    <span
                      className={[
                        "inline-block border px-2 py-0.5 text-[10px] uppercase tracking-[0.2em]",
                        o.global_role === "admin"
                          ? "border-[var(--accent)] text-[var(--accent)]"
                          : "border-foreground/15 text-foreground/60",
                      ].join(" ")}
                    >
                      {o.global_role}
                    </span>
                  </Td>
                  <Td className="text-right font-mono">
                    <TelemetryNumber value={o.friction_level} />
                  </Td>
                  <Td className="text-right font-mono">
                    <TelemetryNumber value={o.calcification_level} />
                  </Td>
                  <Td className="text-foreground/70">
                    {o.brand_ids
                      .map((id) => brandsQ.data?.find((b) => b.id === id)?.name)
                      .filter(Boolean)
                      .join(", ") || "—"}
                  </Td>
                  <Td className="font-mono text-[11px] text-foreground/40">
                    {new Date(o.created_at).toISOString().slice(0, 10)}
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {drawerOpen ? (
        <RegisterDrawer
          onClose={() => setDrawerOpen(false)}
          brands={brandsQ.data ?? []}
          submitting={createM.isPending}
          onSubmit={(input) => createM.mutate(input)}
        />
      ) : null}
    </div>
  );
}

function TelemetryNumber({ value }: { value: number | null | undefined }) {
  if (value == null) return <span className="text-foreground/20">—</span>;
  const tone =
    value > 75 ? "text-destructive" : value > 50 ? "text-[var(--accent)]" : "text-foreground/70";
  return <span className={tone}>{value}</span>;
}

function Th({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <th className={`px-4 py-3 font-normal ${className}`}>{children}</th>;
}
function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-3 align-top ${className}`}>{children}</td>;
}

export function PageHeader({
  eyebrow,
  title,
  actions,
}: {
  eyebrow: string;
  title: string;
  actions?: React.ReactNode;
}) {
  return (
    <header className="flex items-center justify-between border-b border-foreground/5 px-8 py-5">
      <div>
        <div className="font-mono text-[10px] uppercase tracking-[0.32em] text-foreground/40">
          {eyebrow}
        </div>
        <h1 className="mt-1 font-display text-[22px] tracking-tight text-foreground">{title}</h1>
      </div>
      {actions}
    </header>
  );
}

function RegisterDrawer({
  onClose,
  brands,
  submitting,
  onSubmit,
}: {
  onClose: () => void;
  brands: { id: UUID; name: string }[];
  submitting: boolean;
  onSubmit: (input: {
    full_name: string;
    email: string;
    password: string;
    global_role: GlobalRole;
    brand_ids: UUID[];
  }) => void;
}) {
  const [full_name, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<GlobalRole>("operator");
  const [brandIds, setBrandIds] = useState<UUID[]>([]);

  const toggleBrand = (id: UUID) =>
    setBrandIds((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
      <div className="flex w-full max-w-[460px] flex-col border-l border-foreground/10 bg-[var(--card)]">
        <div className="flex items-center justify-between border-b border-foreground/5 px-6 py-4">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-foreground/40">
              New
            </div>
            <div className="text-[15px] text-foreground">Register Operator</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-[3px] p-1.5 text-foreground/40 hover:bg-foreground/5 hover:text-foreground"
          >
            <X className="size-4" strokeWidth={1.5} />
          </button>
        </div>

        <form
          className="flex flex-1 flex-col gap-5 overflow-y-auto px-6 py-6"
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit({ full_name, email, password, global_role: role, brand_ids: brandIds });
          }}
        >
          <Input label="Full name" value={full_name} onChange={setFullName} required />
          <Input label="Email" type="email" value={email} onChange={setEmail} required />
          <Input label="Access key" type="password" value={password} onChange={setPassword} required />

          <div>
            <Label>Global role</Label>
            <div className="mt-2 flex gap-2">
              {(["operator", "admin"] as GlobalRole[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={[
                    "flex-1 border px-3 py-2 text-[11px] uppercase tracking-[0.24em] transition-colors",
                    role === r
                      ? "border-[var(--accent)] bg-[color-mix(in_oklab,var(--accent)_10%,transparent)] text-foreground"
                      : "border-foreground/10 text-foreground/50 hover:text-foreground",
                  ].join(" ")}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label>Knowledge Linkage · Brands</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {brands.map((b) => {
                const on = brandIds.includes(b.id);
                return (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => toggleBrand(b.id)}
                    className={[
                      "border px-3 py-1.5 text-[12px] transition-colors",
                      on
                        ? "border-[var(--accent)] text-[var(--accent)]"
                        : "border-foreground/10 text-foreground/60 hover:text-foreground",
                    ].join(" ")}
                  >
                    {b.name}
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="mt-auto inline-flex items-center justify-between border border-[var(--accent)] px-5 py-3 text-[11px] uppercase tracking-[0.28em] text-foreground transition-all hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)] disabled:opacity-40"
          >
            <span>Commit Operator</span>
            <span className="font-mono text-[10px] opacity-60">›</span>
          </button>
        </form>
      </div>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-foreground/45">
      {children}
    </span>
  );
}

function Input({
  label,
  value,
  onChange,
  type = "text",
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <Label>{label}</Label>
      <input
        type={type}
        value={value}
        required={required}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full border-b border-foreground/10 bg-transparent py-2 font-mono text-[14px] text-foreground outline-none focus:border-[var(--accent)]/60"
      />
    </label>
  );
}