import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, type ReactNode } from "react";
import { AlertTriangle, ArrowLeft, CheckCircle2 } from "lucide-react";
import { z } from "zod";
import { companyApi, knowledgeApi, sessionsApi, usersApi } from "@/lib/api";
import type {
  CompanyDiagnostic,
  DiagnosticPayload,
  Glitch,
  SessionRecord,
} from "@/lib/api/types";
import { useSessionStore } from "@/stores/session";
import { MarkdownRenderer } from "@/components/brand/MarkdownRenderer";
import { DialecticThread } from "@/components/brand/DialecticThread";
import { DeepLinkBanner } from "@/components/brand/DeepLinkBanner";
import { ErrorBanner } from "@/components/brand/ErrorBanner";
import { PageHeader } from "@/components/brand/PageHeader";
import { oracleCopy } from "@/lib/i18n/oracle";
import { useT } from "@/lib/i18n";

const searchSchema = z.object({
  alert: z.string().optional(),
  session: z.string().optional(),
});

export const Route = createFileRoute("/_app/audit")({
  head: () => {
    const lang = useSessionStore.getState().chatLanguage;
    const title = lang === "es" ? "PKGD OS · Espacio de Auditación" : "PKGD OS · Audit Space";
    return { meta: [{ title }] };
  },
  validateSearch: searchSchema,
  component: AuditPage,
});

function AuditPage() {
  const search = useSearch({ from: "/_app/audit" });
  const language = useSessionStore((s) => s.chatLanguage);
  const qc = useQueryClient();
  const navigate = useNavigate();
  const t = oracleCopy(language);
  const ta = useT("audit");

  const operatorsQ = useQuery({ queryKey: ["operators"], queryFn: usersApi.listOperators });
  const sessionsQ = useQuery({ queryKey: ["all-sessions"], queryFn: sessionsApi.listAllSessions });

  const [userId, setUserId] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);

  // Company-mood pre-screen: only for Dirección General, shown on every entry
  // to the audit workspace until the director clicks "Enter".
  const sessionUser = useSessionStore((s) => s.user);
  const [showCompanyCover, setShowCompanyCover] = useState(true);
  const me = operatorsQ.data?.find((o) => o.id === sessionUser?.id) ?? null;
  const isDireccionGeneral = me?.department?.name === "Dirección General";

  const handleSelectSession = (id: string | null) => {
    setSessionId(id);
    navigate({
      search: (prev) => {
        const next = { ...prev };
        if (id) {
          next.session = id;
        } else {
          delete next.session;
        }
        return next;
      },
    });
  };

  // Resolve deep-link: ?session=<id> → pick user & session
  useEffect(() => {
    if (!search.session || !sessionsQ.data) return;
    const s = sessionsQ.data.find((x) => x.id === search.session);
    if (s) {
      setUserId(s.user_id);
      setSessionId(s.id);
    }
  }, [search.session, sessionsQ.data]);

  // Default selection: first member in the directory (operator or admin)
  useEffect(() => {
    if (userId || !operatorsQ.data?.length) return;
    setUserId(operatorsQ.data[0].id);
  }, [operatorsQ.data, userId]);

  const selectedUser = operatorsQ.data?.find((o) => o.id === userId) ?? null;
  const userSessions =
    sessionsQ.data
      ?.filter((s) => s.user_id === userId)
      .sort((a, b) => (b.updated_at ?? b.created_at).localeCompare(a.updated_at ?? a.created_at)) ??
    [];
  const selectedSession = sessionsQ.data?.find((s) => s.id === sessionId) ?? null;

  const integrateM = useMutation({
    // Approves the Gold PROPOSAL the dialectic produced: the n8n flow promotes it to Active
    // (into the brand knowledge base) and generates the .docx. No more direct extraction.
    mutationFn: async (id: string) => {
      await knowledgeApi.approveSessionGold(id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["all-sessions"] }),
  });

  const jewelM = useMutation({
    // Approves the Jewel PROPOSAL of a session (same n8n approve-asset flow as Gold).
    mutationFn: async (id: string) => {
      await knowledgeApi.approveSessionJewel(id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["all-sessions"] }),
  });

  // Hold rendering until we know the operator's department, so a Dirección
  // General director never flashes the workspace before the mood pre-screen.
  if (operatorsQ.isLoading) {
    return (
      <div className="flex h-screen flex-col">
        <PageHeader eyebrow={ta.eyebrow} title={t.auditSpace} />
        <div className="flex flex-1 items-center justify-center">
          <span className="font-mono text-[11px] uppercase tracking-[0.28em] text-foreground/35">
            {ta.companyLoading}
          </span>
        </div>
      </div>
    );
  }

  if (isDireccionGeneral && showCompanyCover) {
    return (
      <div className="flex h-screen flex-col">
        <PageHeader eyebrow={ta.companyEyebrow} title={t.auditSpace} />
        <CompanyMoodCover language={language} onEnter={() => setShowCompanyCover(false)} />
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col">
      <PageHeader eyebrow={ta.eyebrow} title={t.auditSpace} />
      {search.alert === "structural_gold" ? (
        <DeepLinkBanner message={ta.goldAlert} />
      ) : null}

      <div className="grid flex-1 grid-cols-[260px_1fr_320px] overflow-hidden">
        {/* Col 1 — Directory (operators + admins) */}
        <aside className="overflow-y-auto border-r border-border">
          <div className="px-5 py-4 font-mono text-[10px] uppercase tracking-[0.28em] text-foreground/40">
            {ta.directory}
          </div>
          <ul>
            {operatorsQ.isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <li key={i} className="animate-pulse border-l-2 border-transparent px-5 py-3">
                  <div className="h-4 w-3/4 rounded bg-foreground/10" />
                  <div className="mt-2 h-3 w-1/2 rounded bg-foreground/5" />
                </li>
              ))
            ) : operatorsQ.isError ? (
              <li className="px-5 py-6 text-center space-y-2">
                <div className="text-[12px] text-destructive">{ta.failOperators}</div>
                <button
                  type="button"
                  onClick={() => operatorsQ.refetch()}
                  className="text-[11px] underline text-foreground/60 hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  {ta.retry}
                </button>
              </li>
            ) : (
              operatorsQ.data?.map((o, idx) => {
                const active = o.id === userId;
                return (
                  <li
                    key={o.id}
                    className="motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-left-2 duration-200"
                    style={{
                      animationDelay: `${idx * 30}ms`,
                      animationFillMode: "both",
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setUserId(o.id);
                        handleSelectSession(null);
                      }}
                      className={[
                        "block w-full border-l-2 px-5 py-3 text-left transition-all relative outline-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:bg-foreground/[0.04] focus-visible:z-10 focus:z-10",
                        active
                          ? "border-[var(--accent)] bg-foreground/[0.03]"
                          : "border-transparent hover:bg-foreground/[0.02]",
                      ].join(" ")}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-[13px] text-foreground">{o.full_name}</div>
                        <span
                          className={[
                            "font-mono text-[9px] uppercase tracking-[0.2em]",
                            o.global_role === "admin"
                              ? "text-[var(--accent)]"
                              : "text-foreground/35",
                          ].join(" ")}
                        >
                          {o.global_role}
                        </span>
                      </div>
                      <div className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.22em] text-foreground/40">
                        {o.email}
                      </div>
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </aside>

        {/* Col 2 — User dashboard OR session transcript */}
        <section className="flex flex-col overflow-hidden border-r border-border">
          {!selectedUser ? (
            <div className="m-auto flex flex-col items-center justify-center p-8 text-center font-mono">
              <div className="border border-dashed border-border bg-card p-8 max-w-sm shadow-sm rounded-[3px]">
                <div className="text-[10px] uppercase tracking-[0.22em] text-foreground/45 mb-2">
                  {ta.workspaceOffline}
                </div>
                <p className="text-[12px] text-foreground/50 leading-relaxed">
                  {ta.workspaceOfflineHint}
                </p>
              </div>
            </div>
          ) : selectedSession ? (
            <div className="flex flex-1 flex-col overflow-hidden motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-right-4 duration-300 ease-[cubic-bezier(0.25,1,0.5,1)]">
              <div className="flex items-center justify-between border-b border-border px-6 py-4">
                <button
                  type="button"
                  onClick={() => handleSelectSession(null)}
                  className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.28em] text-foreground/50 hover:text-[var(--accent)] transition-colors outline-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:text-[var(--accent)] px-2 py-1 -ml-2 rounded-[3px]"
                >
                  <ArrowLeft className="size-3" strokeWidth={1.5} />
                  {selectedUser.full_name}
                </button>
                <div className="text-[14px] text-foreground">{selectedSession.title}</div>
              </div>
              <div className="flex-1 overflow-hidden px-6">
                <DialecticThread
                  messages={selectedSession.transcript_payload}
                  emptyHint={ta.noTranscript}
                  language={language}
                />
              </div>
            </div>
          ) : (
            <UserDashboard
              userId={selectedUser.id}
              userName={selectedUser.full_name}
              sessions={userSessions}
              onSelectSession={handleSelectSession}
              isSessionsLoading={sessionsQ.isLoading}
              isSessionsError={sessionsQ.isError}
              sessionsRefetch={() => sessionsQ.refetch()}
            />
          )}
        </section>

        {/* Col 3 — Session telemetry */}
        <aside className="overflow-y-auto p-6">
          <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-foreground/40">
            {ta.sessionTelemetry}
          </div>
          {selectedSession ? (
            <>
              <TelemetryPanel s={selectedSession} />
              {canApproveJewel(selectedSession) ? (
                <button
                  type="button"
                  disabled={jewelM.isPending}
                  onClick={() => jewelM.mutate(selectedSession.id)}
                  className="mt-6 inline-flex w-full items-center justify-between bg-[var(--accent)] px-4 py-3 text-[11px] uppercase tracking-[0.24em] text-[var(--accent-foreground)] transition-all hover:opacity-90 disabled:opacity-30 outline-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background"
                >
                  <span>{ta.approveJewel}</span>
                  <span className="font-mono text-[10px]">›</span>
                </button>
              ) : canExtractGold(selectedSession) ? (
                <button
                  type="button"
                  disabled={integrateM.isPending}
                  onClick={() => integrateM.mutate(selectedSession.id)}
                  className="mt-6 inline-flex w-full items-center justify-between bg-[var(--accent)] px-4 py-3 text-[11px] uppercase tracking-[0.24em] text-[var(--accent-foreground)] transition-all hover:opacity-90 disabled:opacity-30 outline-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background"
                >
                  <span>{ta.approveGold}</span>
                  <span className="font-mono text-[10px]">›</span>
                </button>
              ) : (
                <p className="mt-6 font-mono text-[10px] uppercase tracking-[0.24em] text-foreground/35">
                  {selectedSession.extracted_asset_id == null
                    ? ta.noProposal
                    : selectedSession.gold_extraction_status === "Extracted"
                      ? selectedSession.close_reason === "jewel"
                        ? ta.jewelIntegrated
                        : ta.goldIntegrated
                      : ta.notReady}
                </p>
              )}
              {integrateM.isError || jewelM.isError ? (
                <div className="mt-4">
                  <ErrorBanner
                    message={ta.approvalFailed}
                    onRetry={() =>
                      (selectedSession.close_reason === "jewel" ? jewelM : integrateM).mutate(
                        selectedSession.id,
                      )
                    }
                  />
                </div>
              ) : null}
            </>
          ) : (
            <div className="mt-6 border border-dashed border-border bg-card p-6 font-mono text-center shadow-sm rounded-[3px]">
              <div className="text-[10px] uppercase tracking-[0.22em] text-foreground/35 mb-2">
                {ta.telemetryStandby}
              </div>
              <p className="text-[11px] text-foreground/40 leading-relaxed">
                {ta.telemetryStandbyHint}
              </p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

// A session is approvable when the dialectic closed and left a pending Gold proposal.
// The reliable signal is `extracted_asset_id` (the proposed Gold asset) — NOT
// `encauzamiento_count`, which n8n/back can leave at 0 even on a valid close.
function canExtractGold(s: SessionRecord): boolean {
  return (
    s.status === "Closed" &&
    s.gold_extraction_status === "Pending" &&
    s.extracted_asset_id != null &&
    s.close_reason !== "jewel"
  );
}

// A Jewel proposal is approvable when its session closed with a pending Jewel
// asset (close_reason 'jewel'); reuses gold_extraction_status as the pending flag.
function canApproveJewel(s: SessionRecord): boolean {
  return (
    s.status === "Closed" &&
    s.gold_extraction_status === "Pending" &&
    s.extracted_asset_id != null &&
    s.close_reason === "jewel"
  );
}

// Weekly company-mood pre-screen shown to Dirección General before the
// audit workspace. Reads the latest snapshot from the n8n weekly flow.
function CompanyMoodCover({
  language,
  onEnter,
}: {
  language: "en" | "es";
  onEnter: () => void;
}) {
  const t = useT("audit");
  const q = useQuery({ queryKey: ["company-diagnostic"], queryFn: companyApi.getDiagnostic });
  const data: CompanyDiagnostic | undefined = q.data;
  const p = data?.payload ?? null;
  const locale = language === "es" ? "es-MX" : "en-US";
  const fmt = (iso?: string | null) =>
    iso ? new Date(iso).toLocaleDateString(locale, { day: "2-digit", month: "short" }) : "—";

  const EnterButton = (
    <button
      onClick={onEnter}
      className="mt-8 inline-flex items-center justify-between gap-6 border border-[var(--accent)] px-6 py-3.5 text-sm font-medium text-foreground transition-all shadow-md active-press cursor-pointer hover:bg-[var(--accent)] hover:text-black"
    >
      <span>{t.companyEnter}</span>
      <span className="font-mono text-[10px] opacity-60">›</span>
    </button>
  );

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto w-full max-w-[840px] px-8 py-10 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 duration-300 ease-out">
        {q.isLoading ? (
          <div className="flex h-[50vh] items-center justify-center">
            <span className="font-mono text-[11px] uppercase tracking-[0.28em] text-foreground/35">
              {t.companyLoading}
            </span>
          </div>
        ) : !data?.has_data ? (
          <div className="border-double-thick bg-card p-8 shadow-md">
            <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-foreground/40">
              {t.companyMood}
            </div>
            <p className="mt-4 text-[14px] leading-relaxed text-foreground/70">
              {t.companyNoData}
            </p>
            {EnterButton}
          </div>
        ) : (
          <>
            <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-foreground/40">
              {t.companyMood}
              {data.period_start || data.period_end ? (
                <span className="ml-3 text-foreground/25">
                  {t.companyPeriod}: {fmt(data.period_start)} – {fmt(data.period_end)}
                </span>
              ) : null}
            </div>

            <div className="mt-3 flex flex-wrap items-end gap-x-8 gap-y-2">
              <h2 className="font-display text-[34px] leading-none text-[var(--accent)]">
                {data.mood_label ?? "—"}
              </h2>
              {data.mood_score != null ? (
                <div className="flex items-baseline gap-2">
                  <span className="font-sonoran text-[40px] leading-none text-foreground">
                    {data.mood_score.toFixed(1)}
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-foreground/35">
                    {t.companyMoodIndex} · 0–10
                  </span>
                </div>
              ) : null}
            </div>

            {data.summary ? (
              <div className="mt-6 border-double-thick bg-card p-6 shadow-md">
                <MarkdownRenderer content={data.summary} />
              </div>
            ) : null}

            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <MoodList title={t.companySignals} items={p?.senales_positivas} accent />
              <MoodList title={t.companyTensions} items={p?.tensiones} />
              <MoodList title={t.companyFocus} items={p?.focos_de_atencion} />
            </div>

            {data.generated_at ? (
              <div className="mt-6 font-mono text-[10px] uppercase tracking-[0.18em] text-foreground/30">
                {new Date(data.generated_at).toLocaleString(locale)}
              </div>
            ) : null}

            {EnterButton}
          </>
        )}
      </div>
    </div>
  );
}

function MoodList({
  title,
  items,
  accent,
}: {
  title: string;
  items?: string[];
  accent?: boolean;
}) {
  const list = items ?? [];
  return (
    <div className="border border-border/60 bg-card/40 p-4">
      <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-foreground/40">
        {title}
      </div>
      {list.length > 0 ? (
        <ul className="mt-2 space-y-1.5">
          {list.map((item, i) => (
            <li key={i} className="flex gap-2 text-[13px] leading-relaxed text-foreground/75">
              <span className={accent ? "text-[var(--accent)]" : "text-foreground/40"}>›</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-[12px] text-foreground/30">—</p>
      )}
    </div>
  );
}

// Rich diagnostic detail (n8n-generated): friction trend, coupling read,
// last encauzamiento valuation and supervision flags.
function DiagnosticDetail({
  payload,
  generatedAt,
  triggerReason,
}: {
  payload: DiagnosticPayload;
  generatedAt: string | null;
  triggerReason: string | null;
}) {
  const t = useT("audit");
  const ft = payload.friction_trend;
  const cp = payload.coupling;
  const le = payload.last_encauzamiento;
  const flags = payload.supervision_flags ?? [];
  const reasonLabel =
    triggerReason === "coupling_max"
      ? t.reasonCouplingMax
      : triggerReason === "coupling_pause"
        ? t.reasonCouplingPause
        : triggerReason === "encauzamiento"
          ? t.reasonChanneling
          : (triggerReason ?? "");

  return (
    <div className="mt-5 space-y-4 border-t border-border/60 pt-4">
      {ft ? (
        <DiagSection title={t.diagFrictionTrend}>
          <div className="flex items-center gap-2">
            <TrendChip direction={ft.direction} />
            {ft.stuck_level != null ? (
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-foreground/50">
                {t.diagStuck} ~{ft.stuck_level}
              </span>
            ) : null}
          </div>
          {ft.lectura ? (
            <p className="mt-1.5 text-[13px] leading-relaxed text-foreground/75">{ft.lectura}</p>
          ) : null}
        </DiagSection>
      ) : null}

      {cp ? (
        <DiagSection title={t.diagCoupling}>
          <p className="text-[13px] leading-relaxed text-foreground/75">
            <span className="font-medium text-foreground/90">
              {cp.entered_last_3 ? t.diagEntered : t.diagNotEntered}
            </span>{" "}
            {cp.porque}
          </p>
          {cp.vigilar ? (
            <p className="mt-1 text-[13px] leading-relaxed text-foreground/60">
              <span className="text-[var(--accent)]">{t.diagWatch}</span> {cp.vigilar}
            </p>
          ) : null}
        </DiagSection>
      ) : null}

      {le?.valoracion ? (
        <DiagSection title={t.diagLastChanneling}>
          <p className="text-[13px] leading-relaxed text-foreground/75">{le.valoracion}</p>
        </DiagSection>
      ) : null}

      {flags.length > 0 ? (
        <DiagSection title={t.diagToSupervise}>
          <ul className="space-y-1">
            {flags.map((f, i) => (
              <li key={i} className="flex gap-2 text-[13px] leading-relaxed text-foreground/75">
                <span className="text-[var(--accent)]">›</span>
                <span>{f}</span>
              </li>
            ))}
          </ul>
        </DiagSection>
      ) : null}

      {generatedAt ? (
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-foreground/35">
          {reasonLabel ? `${reasonLabel} · ` : ""}
          {new Date(generatedAt).toLocaleString()}
        </div>
      ) : null}
    </div>
  );
}

function DiagSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-foreground/40">
        {title}
      </div>
      <div className="mt-1">{children}</div>
    </div>
  );
}

function TrendChip({ direction }: { direction?: string }) {
  const t = useT("audit");
  const map: Record<string, { label: string; cls: string }> = {
    subiendo: { label: t.trendRising, cls: "text-red-400" },
    bajando: { label: t.trendFalling, cls: "text-emerald-400" },
    plano: { label: t.trendFlat, cls: "text-foreground/60" },
  };
  const m = map[direction ?? "plano"] ?? { label: direction ?? "—", cls: "text-foreground/60" };
  return <span className={`font-mono text-[11px] font-medium ${m.cls}`}>{m.label}</span>;
}

/* ---------- User dashboard ---------- */

function UserDashboard({
  userId,
  userName,
  sessions,
  onSelectSession,
  isSessionsLoading,
  isSessionsError,
  sessionsRefetch,
}: {
  userId: string;
  userName: string;
  sessions: SessionRecord[];
  onSelectSession: (id: string) => void;
  isSessionsLoading?: boolean;
  isSessionsError?: boolean;
  sessionsRefetch?: () => void;
}) {
  const t = useT("audit");
  const diagQ = useQuery({
    queryKey: ["diagnostic", userId],
    queryFn: () => usersApi.getOperatorDiagnostic(userId),
  });

  return (
    <div className="flex-1 overflow-y-auto px-8 py-6 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-left-4 duration-300 ease-[cubic-bezier(0.25,1,0.5,1)]">
      <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-foreground/40">
        {t.memberDiagnostic}
      </div>
      <h2 className="mt-1 font-display text-[20px] text-foreground">{userName}</h2>

      {diagQ.isError ? (
        <div className="mt-6">
          <ErrorBanner
            message={t.failDiagnostic}
            onRetry={() => diagQ.refetch()}
          />
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-[200px_1fr] gap-6 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 duration-300 ease-out">
          <div className="border-double-thick bg-card p-5 shadow-md">
            <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-foreground/40">
              {t.maxFriction}
            </div>
            <div
              className={[
                "mt-2 font-sonoran text-[40px] leading-none",
                diagQ.isLoading ? "text-foreground/20" : "text-[var(--accent)]",
              ].join(" ")}
            >
              {diagQ.isLoading ? "—" : (diagQ.data?.max_friction ?? 0).toFixed(1)}
            </div>
            <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.22em] text-foreground/35">
              {t.frictionScale}
            </div>
          </div>

          <div className="border-double-thick bg-card p-5 shadow-md">
            <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-foreground/40">
              {t.diagnostic}
            </div>
            <p className="mt-2 text-[14px] leading-relaxed text-foreground/85">
              {diagQ.isLoading ? t.loading : (diagQ.data?.text ?? "—")}
            </p>
            <div className="mt-4 grid grid-cols-3 gap-3 font-mono text-[11px] text-foreground/60">
              <Metric
                label={t.metricChanneled}
                value={diagQ.isLoading ? 0 : (diagQ.data?.encauzamiento_count ?? 0)}
              />
              <Metric
                label={t.metricCoupling}
                value={diagQ.isLoading ? 0 : (diagQ.data?.coupling_node_count ?? 0)}
              />
              <Metric
                label={t.metricGlitches}
                value={diagQ.isLoading ? 0 : (diagQ.data?.glitch_count ?? 0)}
              />
            </div>
            {diagQ.data?.payload ? (
              <DiagnosticDetail
                payload={diagQ.data.payload}
                generatedAt={diagQ.data.generated_at ?? null}
                triggerReason={diagQ.data.trigger_reason ?? null}
              />
            ) : null}
          </div>
        </div>
      )}

      {/* Glitches */}
      <div className="mt-8">
        <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-foreground/40">
          {t.glitches}
        </div>
        {!diagQ.isLoading && diagQ.data && diagQ.data.glitches.length > 0 ? (
          <div className="mt-3 grid grid-cols-2 gap-3">
            {diagQ.data.glitches.map((g, idx) => (
              <div
                key={g.id}
                className="motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95 duration-200"
                style={{
                  animationDelay: `${idx * 40}ms`,
                  animationFillMode: "both",
                }}
              >
                <GlitchCard glitch={g} />
              </div>
            ))}
          </div>
        ) : !diagQ.isLoading ? (
          <p className="mt-3 text-[12px] text-foreground/35">{t.noGlitches}</p>
        ) : null}
      </div>

      {/* Sessions */}
      <div className="mt-8">
        <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-foreground/40">
          {t.sessions}
        </div>
        <div className="mt-3 border-double-thick bg-card shadow-lg">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b-4 border-double border-border bg-foreground/[0.03] text-[10px] uppercase tracking-[0.22em] text-foreground/60">
                <th className="px-4 py-2.5 font-normal">{t.colTitle}</th>
                <th className="px-4 py-2.5 font-normal">{t.colDate}</th>
                <th className="px-4 py-2.5 font-normal text-right">{t.colFriction}</th>
                <th className="px-4 py-2.5 font-normal" title={t.colChanneledTip}>
                  {t.colChanneled}
                </th>
                <th className="px-4 py-2.5 font-normal">{t.colStatus}</th>
              </tr>
            </thead>
            <tbody>
              {isSessionsLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i} className="border-b border-foreground/15">
                    <td colSpan={5} className="px-4 py-4">
                      <div className="h-4 w-2/3 bg-foreground/10 animate-pulse rounded" />
                    </td>
                  </tr>
                ))
              ) : isSessionsError ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-[12px] text-destructive">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <span>{t.failSessions}</span>
                      {sessionsRefetch && (
                        <button
                          type="button"
                          onClick={sessionsRefetch}
                          className="text-[11px] underline text-foreground/60 hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        >
                          {t.retry}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                <>
                  {sessions.map((s, idx) => (
                    <tr
                      key={s.id}
                      onClick={() => onSelectSession(s.id)}
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          onSelectSession(s.id);
                        }
                      }}
                      className="cursor-pointer border-b border-dashed border-border/40 text-[13px] last:border-0 hover:bg-foreground/[0.01] outline-none focus-visible:bg-foreground/[0.04] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring transition-colors motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 duration-300"
                      style={{
                        animationDelay: `${idx * 25}ms`,
                        animationFillMode: "both",
                      }}
                    >
                      <td className="px-4 py-2.5 text-foreground font-semibold">{s.title}</td>
                      <td className="px-4 py-2.5 font-mono text-[11px] text-foreground/45">
                        {new Date(s.created_at).toISOString().slice(0, 10)}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono text-[12px] text-foreground/75">
                        <span className="text-foreground/30 font-light">[</span>{" "}
                        {(s.friction_level ?? 0).toFixed(1)}{" "}
                        <span className="text-foreground/30 font-light">]</span>
                      </td>
                      <td className="px-4 py-2.5">
                        {s.encauzamiento_count > 0 ? (
                          <span className="font-mono text-[11px] text-[var(--accent)]">
                            [ ✓ {s.encauzamiento_count} ]
                          </span>
                        ) : (
                          <span className="font-mono text-[11px] text-foreground/30">[ — ]</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 font-mono text-[10px] uppercase tracking-[0.22em] text-foreground/60">
                        [ {s.status} ]
                      </td>
                    </tr>
                  ))}
                  {sessions.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-4 py-8 text-center text-[12px] text-foreground/40"
                      >
                        {t.noSessions}
                      </td>
                    </tr>
                  ) : null}
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="text-[9px] uppercase tracking-[0.24em] text-foreground/35">{label}</div>
      <div className="mt-0.5 text-[16px] text-foreground">{value}</div>
    </div>
  );
}

function GlitchCard({ glitch }: { glitch: Glitch }) {
  const t = useT("audit");
  const healthy = glitch.score >= 5;
  return (
    <div
      className={[
        "flex gap-3 border p-4 bg-card shadow-sm rounded-[3px]",
        healthy ? "border-[var(--accent)]/35" : "border-yellow-500/35",
      ].join(" ")}
    >
      <div className="pt-0.5">
        {healthy ? (
          <CheckCircle2 className="size-4 text-[var(--accent)]" strokeWidth={1.5} />
        ) : (
          <AlertTriangle className="size-4 text-yellow-400" strokeWidth={1.5} />
        )}
      </div>
      <div className="flex-1">
        <p className="text-[13px] leading-snug text-foreground/85">{glitch.text}</p>
        <div className="mt-2 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.22em] text-foreground/40">
          <span>{new Date(glitch.ts).toISOString().slice(0, 10)}</span>
          <span className={healthy ? "text-[var(--accent)]" : "text-yellow-400"}>
            {t.score} {glitch.score.toFixed(1)}
          </span>
        </div>
      </div>
    </div>
  );
}

function TelemetryPanel({ s }: { s: SessionRecord }) {
  const t = useT("audit");
  const rows: Array<[string, React.ReactNode, string?]> = [
    [t.tMaxFriction, (s.friction_level ?? 0).toFixed(1), t.tMaxFrictionTip],
    [t.tCalcification, s.calcification_delta, t.tCalcificationTip],
    [t.tIntervals, s.interval_count],
    [t.tGlitches, s.glitch_count],
    [t.tChanneled, s.encauzamiento_count, t.tChanneledTip],
    [t.tCouplingNode, s.coupling_node_triggered ? t.tTriggered : "—", t.tCouplingNodeTip],
    [t.tResolution, s.resolution_status],
    [t.tGoldStatus, s.gold_extraction_status],
    [
      t.tIntegration,
      s.integration_signal_received_at
        ? new Date(s.integration_signal_received_at).toISOString().slice(0, 16).replace("T", " ")
        : "—",
    ],
  ];
  return (
    <dl className="mt-4 divide-y divide-border border border-border bg-card shadow-sm rounded-[3px]">
      {rows.map(([k, v, tooltip], idx) => (
        <div
          key={k}
          className="flex items-center justify-between px-4 py-2.5 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-right-2 duration-200"
          style={{
            animationDelay: `${idx * 20}ms`,
            animationFillMode: "both",
          }}
        >
          <dt
            className="text-[11px] uppercase tracking-[0.22em] text-foreground/45"
            title={tooltip}
          >
            {k}
          </dt>
          <dd className="font-mono text-[13px] text-foreground">{v}</dd>
        </div>
      ))}
    </dl>
  );
}
