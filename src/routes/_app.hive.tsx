import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import { brandsApi, usersApi, departmentsApi } from "@/lib/api";
import type { GlobalRole, UUID, Department, DepartmentRole } from "@/lib/api/types";
import type { OperatorRow } from "@/lib/api/users";
import { ErrorBanner } from "@/components/brand/ErrorBanner";
import { PageHeader } from "@/components/brand/PageHeader";

import { useSessionStore } from "@/stores/session";
import { oracleCopy } from "@/lib/i18n/oracle";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/_app/hive")({
  head: () => {
    const lang = useSessionStore.getState().chatLanguage;
    const title =
      lang === "es" ? "PKGD OS · Administración de Usuarios" : "PKGD OS · User Management";
    return { meta: [{ title }] };
  },
  component: HivePage,
});

function HivePage() {
  const qc = useQueryClient();
  const operatorsQ = useQuery({ queryKey: ["operators"], queryFn: usersApi.listOperators });
  const brandsQ = useQuery({ queryKey: ["brands"], queryFn: brandsApi.listBrands });

  const language = useSessionStore((s) => s.chatLanguage);
  const t = oracleCopy(language);
  const th = useT("hive");

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<OperatorRow | null>(null);
  const [deleting, setDeleting] = useState<OperatorRow | null>(null);

  const createM = useMutation({
    mutationFn: usersApi.createOperator,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["operators"] });
      setDrawerOpen(false);
    },
  });
  const updateM = useMutation({
    mutationFn: ({
      id,
      patch,
    }: {
      id: UUID;
      patch: Parameters<typeof usersApi.updateOperator>[1];
    }) => usersApi.updateOperator(id, patch),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["operators"] });
      setEditing(null);
    },
  });
  const deleteM = useMutation({
    mutationFn: usersApi.deleteOperator,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["operators"] });
      setDeleting(null);
    },
  });

  return (
    <div className="flex h-screen flex-col">
      <PageHeader
        eyebrow={th.eyebrow}
        title={t.userManagement}
        actions={
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="inline-flex items-center gap-2 border border-[var(--accent)] px-4 py-2 text-[11px] uppercase tracking-[0.24em] text-foreground transition-colors hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <Plus className="size-3.5" strokeWidth={2} />
              {th.registerOperator}
            </button>
          </div>
        }
      />

      <div className="flex-1 overflow-auto px-8 py-6">
        <div className="border-double-thick bg-card shadow-lg">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b-4 border-double border-border bg-foreground/[0.03] text-[10px] uppercase tracking-[0.22em] text-foreground/60">
                <Th>{th.colOperator}</Th>
                <Th>{th.colRole}</Th>
                <Th>{th.colDeptRole}</Th>
                <Th className="text-right" title={th.colFrictionTip}>
                  {th.colFriction}
                </Th>
                <Th className="text-right" title={th.colCalcificationTip}>
                  {th.colCalcification}
                </Th>
                <Th>{th.colBrands}</Th>
                <Th>{th.colCreated}</Th>
                <Th className="text-right">{th.colActions}</Th>
              </tr>
            </thead>
            <tbody>
              {operatorsQ.isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="border-b border-border last:border-0">
                    {Array.from({ length: 8 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-3 animate-pulse rounded-sm bg-foreground/5" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : operatorsQ.isError ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-[12px] text-destructive">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <span>{th.failOperators}</span>
                      <button
                        type="button"
                        onClick={() => operatorsQ.refetch()}
                        className="text-[11px] underline text-foreground/60 hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      >
                        {th.retry}
                      </button>
                    </div>
                  </td>
                </tr>
              ) : operatorsQ.data?.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-[12px] text-foreground/40">
                    {th.noOperators}{" "}
                    <button
                      type="button"
                      onClick={() => setDrawerOpen(true)}
                      className="text-[var(--accent)] underline-offset-2 hover:underline"
                    >
                      {th.registerFirst}
                    </button>
                  </td>
                </tr>
              ) : (
                operatorsQ.data?.map((o, idx) => (
                  <tr
                    key={o.id}
                    className="border-b border-dashed border-border/40 text-[13px] last:border-0 hover:bg-foreground/[0.01] transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] motion-safe:animate-in motion-safe:fade-in"
                    style={{ animationDelay: `${Math.min(idx * 30, 300)}ms` }}
                  >
                    <Td>
                      <div className="text-foreground font-semibold">{o.full_name}</div>
                      <div className="font-mono text-[11px] text-foreground/45">{o.email}</div>
                    </Td>
                    <Td>
                      <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-foreground/75">
                        [{" "}
                        <span
                          className={
                            o.global_role === "admin"
                              ? "text-[var(--accent)] font-semibold"
                              : "text-foreground/55"
                          }
                        >
                          {o.global_role}
                        </span>{" "}
                        ]
                      </span>
                    </Td>
                    <Td>
                      {o.department ? (
                        <div className="min-w-0">
                          <div
                            className="text-foreground font-semibold truncate"
                            title={o.department.name}
                          >
                            {o.department.name}
                          </div>
                          <div
                            className="font-mono text-[11px] text-foreground/45 truncate mt-0.5"
                            title={o.department_role?.name || "—"}
                          >
                            {o.department_role?.name || "—"}
                          </div>
                        </div>
                      ) : (
                        <span className="text-foreground/30 font-light">—</span>
                      )}
                    </Td>
                    <Td className="text-right font-mono text-[12px]">
                      <span className="text-foreground/30 font-light">[</span>{" "}
                      <TelemetryNumber value={o.friction_level} />{" "}
                      <span className="text-foreground/30 font-light">]</span>
                    </Td>
                    <Td className="text-right font-mono text-[12px]">
                      <span className="text-foreground/30 font-light">[</span>{" "}
                      <TelemetryNumber value={o.calcification_level} />{" "}
                      <span className="text-foreground/30 font-light">]</span>
                    </Td>
                    <Td className="text-foreground/70 font-mono text-[11px]">
                      {o.brand_ids
                        .map((id) => brandsQ.data?.find((b) => b.id === id)?.name)
                        .filter(Boolean)
                        .join(", ") || "—"}
                    </Td>
                    <Td className="font-mono text-[11px] text-foreground/45">
                      {new Date(o.created_at).toISOString().slice(0, 10)}
                    </Td>
                    <Td className="text-right font-mono text-[11px] uppercase tracking-[0.1em]">
                      <div className="inline-flex gap-2.5 justify-end">
                        <button
                          type="button"
                          onClick={() => setEditing(o)}
                          className="text-foreground/45 hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        >
                          [{th.edit}]
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleting(o)}
                          className="text-destructive/60 hover:text-destructive transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        >
                          [{th.delete}]
                        </button>
                      </div>
                    </Td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {drawerOpen ? (
        <RegisterDrawer
          onClose={() => {
            setDrawerOpen(false);
            createM.reset();
          }}
          brands={brandsQ.data ?? []}
          submitting={createM.isPending}
          error={createM.isError}
          onSubmit={(input) => createM.mutate(input)}
        />
      ) : null}

      {editing ? (
        <EditDrawer
          operator={editing}
          brands={brandsQ.data ?? []}
          submitting={updateM.isPending}
          error={updateM.isError}
          onClose={() => {
            setEditing(null);
            updateM.reset();
          }}
          onSubmit={(patch) => updateM.mutate({ id: editing.id, patch })}
        />
      ) : null}

      {deleting ? (
        <DeleteDialog
          operator={deleting}
          submitting={deleteM.isPending}
          error={deleteM.isError}
          onClose={() => {
            setDeleting(null);
            deleteM.reset();
          }}
          onConfirm={() => deleteM.mutate(deleting.id)}
          onRetry={() => deleteM.mutate(deleting.id)}
        />
      ) : null}
    </div>
  );
}

function TelemetryNumber({ value }: { value: number | null | undefined }) {
  if (value == null) return <span className="text-foreground/20">—</span>;
  const tone =
    value > 7.5 ? "text-destructive" : value > 5 ? "text-[var(--accent)]" : "text-foreground/70";
  return <span className={tone}>{value}</span>;
}

function Th({
  children,
  className = "",
  title,
}: {
  children: React.ReactNode;
  className?: string;
  title?: string;
}) {
  return (
    <th className={`px-4 py-3 font-normal ${className}`} title={title}>
      {children}
    </th>
  );
}
function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-3 align-top ${className}`}>{children}</td>;
}

function RegisterDrawer({
  onClose,
  brands,
  submitting,
  error,
  onSubmit,
}: {
  onClose: () => void;
  brands: { id: UUID; name: string }[];
  submitting: boolean;
  error: boolean;
  onSubmit: (input: {
    full_name: string;
    email: string;
    password: string;
    global_role: GlobalRole;
    brand_ids: UUID[];
    department_id?: UUID;
    department_role_id?: UUID;
  }) => void;
}) {
  const t = useT("hive");
  const [full_name, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<GlobalRole>("operator");
  const [brandIds, setBrandIds] = useState<UUID[]>([]);
  const [departmentId, setDepartmentId] = useState<UUID | "">("");
  const [departmentRoleId, setDepartmentRoleId] = useState<UUID | "">("");

  const deptsQ = useQuery({ queryKey: ["departments"], queryFn: departmentsApi.listDepartments });
  const selectedDept = deptsQ.data?.find((d) => d.id === departmentId);
  const deptRoles = selectedDept?.roles ?? [];

  const toggleBrand = (id: UUID) =>
    setBrandIds((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm transition-opacity duration-300 motion-safe:animate-in motion-safe:fade-in">
      <div className="flex w-full max-w-[460px] flex-col border-l-[6px] border-double border-border bg-[var(--card)] transition-transform duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] motion-safe:animate-in motion-safe:slide-in-from-right-full">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-foreground/40">
              {t.new}
            </div>
            <div className="text-[15px] text-foreground">{t.registerOperator}</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-[3px] p-1.5 text-foreground/40 hover:bg-foreground/5 hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring transition-colors"
          >
            <X className="size-4" strokeWidth={1.5} />
          </button>
        </div>

        <form
          className="flex flex-1 flex-col gap-5 overflow-y-auto px-6 py-6"
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit({
              full_name,
              email,
              password,
              global_role: role,
              brand_ids: brandIds,
              department_id: departmentId || undefined,
              department_role_id: departmentRoleId || undefined,
            });
          }}
        >
          <Input label={t.fullName} value={full_name} onChange={setFullName} required />
          <Input label={t.email} type="email" value={email} onChange={setEmail} required />
          <Input
            label={t.accessKey}
            type="password"
            value={password}
            onChange={setPassword}
            required
          />

          <div>
            <Label>{t.globalRole}</Label>
            <div className="mt-2 flex gap-2">
              {(["operator", "admin"] as GlobalRole[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={[
                    "flex-1 border px-3 py-2 text-[11px] uppercase tracking-[0.24em] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                    role === r
                      ? "border-[var(--accent)] bg-[color-mix(in_oklab,var(--accent)_10%,transparent)] text-foreground"
                      : "border-border text-foreground/50 hover:text-foreground",
                  ].join(" ")}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label>{t.department}</Label>
            <div className="flex items-center gap-1 mt-1 border border-border bg-foreground/[0.01] px-2 focus-within:border-[var(--accent)] transition-colors shadow-sm rounded-[3px]">
              <span className="font-mono text-foreground/30 select-none text-[13px] pr-1">[</span>
              <select
                value={departmentId}
                onChange={(e) => {
                  setDepartmentId(e.target.value);
                  setDepartmentRoleId("");
                }}
                className="w-full bg-transparent py-1.5 text-[13px] text-foreground outline-none cursor-pointer"
              >
                <option value="" className="bg-background text-foreground/50">
                  {t.selectDepartment}
                </option>
                {deptsQ.data?.map((d) => (
                  <option key={d.id} value={d.id} className="bg-background text-foreground">
                    {d.name}
                  </option>
                ))}
              </select>
              <span className="font-mono text-foreground/30 select-none text-[13px] pl-1">]</span>
            </div>
          </div>

          <div>
            <Label>{t.departmentRole}</Label>
            <div className="flex items-center gap-1 mt-1 border border-border bg-foreground/[0.01] px-2 focus-within:border-[var(--accent)] transition-colors shadow-sm rounded-[3px]">
              <span className="font-mono text-foreground/30 select-none text-[13px] pr-1">[</span>
              <select
                value={departmentRoleId}
                disabled={!departmentId}
                onChange={(e) => setDepartmentRoleId(e.target.value)}
                className="w-full bg-transparent py-1.5 text-[13px] text-foreground outline-none cursor-pointer disabled:opacity-40"
              >
                <option value="" className="bg-background text-foreground/50">
                  {t.selectRole}
                </option>
                {deptRoles.map((r) => (
                  <option key={r.id} value={r.id} className="bg-background text-foreground">
                    {r.name}
                  </option>
                ))}
              </select>
              <span className="font-mono text-foreground/30 select-none text-[13px] pl-1">]</span>
            </div>
          </div>

          <div>
            <Label>{t.brandsLink}</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {brands.map((b) => {
                const on = brandIds.includes(b.id);
                return (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => toggleBrand(b.id)}
                    className={[
                      "border px-3 py-1.5 text-[12px] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                      on
                        ? "border-[var(--accent)] text-[var(--accent)]"
                        : "border-border text-foreground/60 hover:text-foreground",
                    ].join(" ")}
                  >
                    {b.name}
                  </button>
                );
              })}
            </div>
          </div>

          {error ? (
            <ErrorBanner message={t.errRegister} />
          ) : null}

          <button
            type="submit"
            disabled={submitting}
            className="mt-auto inline-flex items-center justify-between border border-[var(--accent)] px-5 py-3 text-[11px] uppercase tracking-[0.28em] text-foreground transition-all hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)] disabled:opacity-40 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <span>{t.commitOperator}</span>
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
        className="mt-1 w-full border-b border-border bg-transparent py-2 font-mono text-[14px] text-foreground outline-none transition-colors duration-300 focus:border-foreground/35 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      />
    </label>
  );
}

function EditDrawer({
  operator,
  brands,
  submitting,
  error,
  onClose,
  onSubmit,
}: {
  operator: OperatorRow;
  brands: { id: UUID; name: string }[];
  submitting: boolean;
  error: boolean;
  onClose: () => void;
  onSubmit: (patch: {
    full_name?: string;
    email?: string;
    global_role?: GlobalRole;
    brand_ids?: UUID[];
    department_id?: UUID | null;
    department_role_id?: UUID | null;
  }) => void;
}) {
  const t = useT("hive");
  const [full_name, setFullName] = useState(operator.full_name);
  const [email, setEmail] = useState(operator.email);
  const [role, setRole] = useState<GlobalRole>(operator.global_role);
  const [brandIds, setBrandIds] = useState<UUID[]>(operator.brand_ids);
  const [departmentId, setDepartmentId] = useState<UUID | "">(operator.department_id || "");
  const [departmentRoleId, setDepartmentRoleId] = useState<UUID | "">(
    operator.department_role_id || "",
  );

  const deptsQ = useQuery({ queryKey: ["departments"], queryFn: departmentsApi.listDepartments });
  const selectedDept = deptsQ.data?.find((d) => d.id === departmentId);
  const deptRoles = selectedDept?.roles ?? [];

  const toggleBrand = (id: UUID) =>
    setBrandIds((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm transition-opacity duration-300 motion-safe:animate-in motion-safe:fade-in">
      <div className="flex w-full max-w-[460px] flex-col border-l-[6px] border-double border-border bg-[var(--card)] transition-transform duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] motion-safe:animate-in motion-safe:slide-in-from-right-full">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-foreground/40">
              {t.editLabel}
            </div>
            <div className="text-[15px] text-foreground">{operator.full_name}</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-[3px] p-1.5 text-foreground/40 hover:bg-foreground/5 hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring transition-colors"
          >
            <X className="size-4" strokeWidth={1.5} />
          </button>
        </div>

        <form
          className="flex flex-1 flex-col gap-5 overflow-y-auto px-6 py-6"
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit({
              full_name,
              email,
              global_role: role,
              brand_ids: brandIds,
              department_id: departmentId || null,
              department_role_id: departmentRoleId || null,
            });
          }}
        >
          <Input label={t.fullName} value={full_name} onChange={setFullName} required />
          <Input label={t.email} type="email" value={email} onChange={setEmail} required />

          <div>
            <Label>{t.globalRole}</Label>
            <div className="mt-2 flex gap-2">
              {(["operator", "admin"] as GlobalRole[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={[
                    "flex-1 border px-3 py-2 text-[11px] uppercase tracking-[0.24em] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                    role === r
                      ? "border-[var(--accent)] bg-[color-mix(in_oklab,var(--accent)_10%,transparent)] text-foreground"
                      : "border-border text-foreground/50 hover:text-foreground",
                  ].join(" ")}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label>{t.department}</Label>
            <div className="flex items-center gap-1 mt-1 border border-border bg-foreground/[0.01] px-2 focus-within:border-[var(--accent)] transition-colors shadow-sm rounded-[3px]">
              <span className="font-mono text-foreground/30 select-none text-[13px] pr-1">[</span>
              <select
                value={departmentId}
                onChange={(e) => {
                  setDepartmentId(e.target.value);
                  setDepartmentRoleId("");
                }}
                className="w-full bg-transparent py-1.5 text-[13px] text-foreground outline-none cursor-pointer"
              >
                <option value="" className="bg-background text-foreground/50">
                  {t.selectDepartment}
                </option>
                {deptsQ.data?.map((d) => (
                  <option key={d.id} value={d.id} className="bg-background text-foreground">
                    {d.name}
                  </option>
                ))}
              </select>
              <span className="font-mono text-foreground/30 select-none text-[13px] pl-1">]</span>
            </div>
          </div>

          <div>
            <Label>{t.departmentRole}</Label>
            <div className="flex items-center gap-1 mt-1 border border-border bg-foreground/[0.01] px-2 focus-within:border-[var(--accent)] transition-colors shadow-sm rounded-[3px]">
              <span className="font-mono text-foreground/30 select-none text-[13px] pr-1">[</span>
              <select
                value={departmentRoleId}
                disabled={!departmentId}
                onChange={(e) => setDepartmentRoleId(e.target.value)}
                className="w-full bg-transparent py-1.5 text-[13px] text-foreground outline-none cursor-pointer disabled:opacity-40"
              >
                <option value="" className="bg-background text-foreground/50">
                  {t.selectRole}
                </option>
                {deptRoles.map((r) => (
                  <option key={r.id} value={r.id} className="bg-background text-foreground">
                    {r.name}
                  </option>
                ))}
              </select>
              <span className="font-mono text-foreground/30 select-none text-[13px] pl-1">]</span>
            </div>
          </div>

          <div>
            <Label>{t.brandsLink}</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {brands.map((b) => {
                const on = brandIds.includes(b.id);
                return (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => toggleBrand(b.id)}
                    className={[
                      "border px-3 py-1.5 text-[12px] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                      on
                        ? "border-[var(--accent)] text-[var(--accent)]"
                        : "border-border text-foreground/60 hover:text-foreground",
                    ].join(" ")}
                  >
                    {b.name}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-[3px] border border-border p-4">
            <Label>{t.telemetryRO}</Label>
            <div className="mt-2 grid grid-cols-2 gap-3 font-mono text-[12px] text-foreground/70">
              <div>{t.friction}: {operator.friction_level ?? "—"}</div>
              <div>{t.calcification}: {operator.calcification_level ?? "—"}</div>
            </div>
          </div>

          {error ? <ErrorBanner message={t.errSave} /> : null}

          <button
            type="submit"
            disabled={submitting}
            className="mt-auto inline-flex items-center justify-between border border-[var(--accent)] px-5 py-3 text-[11px] uppercase tracking-[0.28em] text-foreground transition-all hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)] disabled:opacity-40 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <span>{submitting ? t.saving : t.saveChanges}</span>
            <span className="font-mono text-[10px] opacity-60">›</span>
          </button>
        </form>
      </div>
    </div>
  );
}

function DeleteDialog({
  operator,
  submitting,
  error,
  onClose,
  onConfirm,
  onRetry,
}: {
  operator: OperatorRow;
  submitting: boolean;
  error: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onRetry?: () => void;
}) {
  const t = useT("hive");
  const [confirm, setConfirm] = useState("");
  const matches = confirm.trim().toLowerCase() === operator.email.toLowerCase();

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 backdrop-blur-sm transition-opacity duration-300 motion-safe:animate-in motion-safe:fade-in">
      <div className="w-full max-w-[440px] border border-border bg-[var(--card)] transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] motion-safe:animate-in motion-safe:zoom-in-95">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-destructive">
              {t.destructive}
            </div>
            <div className="text-[15px] text-foreground">{t.deleteOperator}</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-[3px] p-1.5 text-foreground/40 hover:bg-foreground/5 hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring transition-colors"
          >
            <X className="size-4" strokeWidth={1.5} />
          </button>
        </div>
        <div className="px-6 py-5">
          <p className="text-[13px] text-foreground/70">
            {t.delConfirmPre}{" "}
            <strong className="text-foreground">{operator.full_name}</strong> {t.delConfirmMid}{" "}
            <span className="font-mono text-[var(--accent)]">{operator.email}</span> {t.delConfirmPost}
          </p>
          <input
            type="text"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder={operator.email}
            className="mt-4 w-full border border-border bg-transparent px-3 py-2 font-mono text-[13px] text-foreground outline-none transition-colors duration-300 focus:border-destructive/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
          {error ? (
            <div className="mt-3">
              <ErrorBanner message={t.errDelete} onRetry={onRetry} />
            </div>
          ) : null}
        </div>
        <div className="flex justify-end gap-2 border-t border-border px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="border border-border px-4 py-2 text-[11px] uppercase tracking-[0.24em] text-foreground/60 hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            {t.cancel}
          </button>
          <button
            type="button"
            disabled={!matches || submitting}
            onClick={onConfirm}
            className="border border-destructive bg-destructive/10 px-4 py-2 text-[11px] uppercase tracking-[0.24em] text-destructive hover:bg-destructive hover:text-destructive-foreground disabled:opacity-30 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            {submitting ? t.deleting : t.deleteOperator}
          </button>
        </div>
      </div>
    </div>
  );
}
