import { createFileRoute, useSearch } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { AlertTriangle, ArrowLeft, CheckCircle2 } from "lucide-react";
import { z } from "zod";
import { knowledgeApi, sessionsApi, usersApi } from "@/lib/api";
import type { Glitch, SessionRecord } from "@/lib/api/types";
import { DialecticThread } from "@/components/brand/DialecticThread";
import { DeepLinkBanner } from "@/components/brand/DeepLinkBanner";
import { PageHeader } from "./_app.hive";

const searchSchema = z.object({
  alert: z.string().optional(),
  session: z.string().optional(),
});

export const Route = createFileRoute("/_app/audit")({
  head: () => ({ meta: [{ title: "PKGD OS · Audit Workspace" }] }),
  validateSearch: searchSchema,
  component: AuditPage,
});

function AuditPage() {
  const search = useSearch({ from: "/_app/audit" });
  const qc = useQueryClient();

  const operatorsQ = useQuery({ queryKey: ["operators"], queryFn: usersApi.listOperators });
  const sessionsQ = useQuery({ queryKey: ["all-sessions"], queryFn: sessionsApi.listAllSessions });

  const [userId, setUserId] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);

  // Resolve deep-link: ?session=<id> → pick user & session
  useEffect(() => {
    if (!search.session || !sessionsQ.data) return;
    const s = sessionsQ.data.find((x) => x.id === search.session);
    if (s) {
      setUserId(s.user_id);
      setSessionId(s.id);
    }
  }, [search.session, sessionsQ.data]);

  // Default selection: first operator with sessions
  useEffect(() => {
    if (userId || !operatorsQ.data) return;
    const firstOp = operatorsQ.data.find((o) => o.global_role === "operator");
    if (firstOp) setUserId(firstOp.id);
  }, [operatorsQ.data, userId]);

  const selectedUser = operatorsQ.data?.find((o) => o.id === userId) ?? null;
  const userSessions =
    sessionsQ.data?.filter((s) => s.user_id === userId).sort((a, b) =>
      (b.updated_at ?? b.created_at).localeCompare(a.updated_at ?? a.created_at),
    ) ?? [];
  const selectedSession = sessionsQ.data?.find((s) => s.id === sessionId) ?? null;

  const integrateM = useMutation({
    mutationFn: async (id: string) => {
      await sessionsApi.integrateSession(id);
      await knowledgeApi.extractGold(id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["all-sessions"] }),
  });

  return (
    <div className="flex h-screen flex-col">
      <PageHeader eyebrow="Directorate" title="Audit Workspace" />
      {search.alert === "structural_gold" ? (
        <DeepLinkBanner message="High Probability of Structural Gold Detected!" />
      ) : null}

      <div className="grid flex-1 grid-cols-[260px_1fr_320px] overflow-hidden">
        {/* Col 1 — Operators */}
        <aside className="overflow-y-auto border-r border-foreground/5">
          <div className="px-5 py-4 font-mono text-[10px] uppercase tracking-[0.28em] text-foreground/40">
            Operators
          </div>
          <ul>
            {operatorsQ.data
              ?.filter((o) => o.global_role === "operator")
              .map((o) => {
                const active = o.id === userId;
                return (
                  <li key={o.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setUserId(o.id);
                        setSessionId(null);
                      }}
                      className={[
                        "block w-full border-l-2 px-5 py-3 text-left transition-colors",
                        active
                          ? "border-[var(--accent)] bg-foreground/[0.03]"
                          : "border-transparent hover:bg-foreground/[0.02]",
                      ].join(" ")}
                    >
                      <div className="text-[13px] text-foreground">{o.full_name}</div>
                      <div className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.22em] text-foreground/40">
                        {o.email}
                      </div>
                    </button>
                  </li>
                );
              })}
          </ul>
        </aside>

        {/* Col 2 — User dashboard OR session transcript */}
        <section className="flex flex-col overflow-hidden border-r border-foreground/5">
          {!selectedUser ? (
            <div className="m-auto text-[13px] text-foreground/40">Select an operator.</div>
          ) : selectedSession ? (
            <>
              <div className="flex items-center justify-between border-b border-foreground/5 px-6 py-4">
                <button
                  type="button"
                  onClick={() => setSessionId(null)}
                  className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.28em] text-foreground/50 hover:text-[var(--accent)]"
                >
                  <ArrowLeft className="size-3" strokeWidth={1.5} />
                  {selectedUser.full_name}
                </button>
                <div className="text-[14px] text-foreground">{selectedSession.title}</div>
              </div>
              <div className="flex-1 overflow-hidden px-6">
                <DialecticThread
                  messages={selectedSession.transcript_payload}
                  emptyHint="No transcript."
                />
              </div>
            </>
          ) : (
            <UserDashboard
              userId={selectedUser.id}
              userName={selectedUser.full_name}
              sessions={userSessions}
              onSelectSession={setSessionId}
            />
          )}
        </section>

        {/* Col 3 — Session telemetry */}
        <aside className="overflow-y-auto p-6">
          <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-foreground/40">
            Session Telemetry
          </div>
          {selectedSession ? (
            <>
              <TelemetryPanel s={selectedSession} />
              {canExtractGold(selectedSession) ? (
                <button
                  type="button"
                  disabled={integrateM.isPending}
                  onClick={() => integrateM.mutate(selectedSession.id)}
                  className="mt-6 inline-flex w-full items-center justify-between bg-[var(--accent)] px-4 py-3 text-[11px] uppercase tracking-[0.24em] text-[var(--accent-foreground)] transition-opacity hover:opacity-90 disabled:opacity-30"
                >
                  <span>Approve &amp; Extract Structural Gold</span>
                  <span className="font-mono text-[10px]">›</span>
                </button>
              ) : (
                <p className="mt-6 font-mono text-[10px] uppercase tracking-[0.24em] text-foreground/35">
                  {selectedSession.encauzamiento_count === 0
                    ? "Sin encauzamiento — no apto para extracción."
                    : selectedSession.gold_extraction_status === "Extracted"
                      ? "Oro estructural ya extraído."
                      : "Extracción en curso."}
                </p>
              )}
            </>
          ) : (
            <p className="mt-4 text-[12px] text-foreground/35">
              Selecciona una sesión del usuario para ver su telemetría.
            </p>
          )}
        </aside>
      </div>
    </div>
  );
}

function canExtractGold(s: SessionRecord): boolean {
  return s.encauzamiento_count > 0 && s.gold_extraction_status !== "Extracted";
}

/* ---------- User dashboard ---------- */

function UserDashboard({
  userId,
  userName,
  sessions,
  onSelectSession,
}: {
  userId: string;
  userName: string;
  sessions: SessionRecord[];
  onSelectSession: (id: string) => void;
}) {
  const diagQ = useQuery({
    queryKey: ["diagnostic", userId],
    queryFn: () => usersApi.getOperatorDiagnostic(userId),
  });

  return (
    <div className="flex-1 overflow-y-auto px-8 py-6">
      <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-foreground/40">
        Operator Diagnostic
      </div>
      <h2 className="mt-1 font-display text-[20px] text-foreground">{userName}</h2>

      <div className="mt-6 grid grid-cols-[200px_1fr] gap-6">
        <div className="border border-foreground/5 p-5">
          <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-foreground/40">
            Max Friction
          </div>
          <div className="mt-2 font-display text-[40px] leading-none text-[var(--accent)]">
            {(diagQ.data?.max_friction ?? 0).toFixed(1)}
          </div>
          <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.22em] text-foreground/35">
            scale 0.0 – 10.0
          </div>
        </div>

        <div className="border border-foreground/5 p-5">
          <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-foreground/40">
            Diagnostic
          </div>
          <p className="mt-2 text-[14px] leading-relaxed text-foreground/85">
            {diagQ.data?.text ?? "—"}
          </p>
          <div className="mt-4 grid grid-cols-3 gap-3 font-mono text-[11px] text-foreground/60">
            <Metric label="Encauz." value={diagQ.data?.encauzamiento_count ?? 0} />
            <Metric label="Coupling" value={diagQ.data?.coupling_node_count ?? 0} />
            <Metric label="Glitches" value={diagQ.data?.glitch_count ?? 0} />
          </div>
        </div>
      </div>

      {/* Glitches */}
      <div className="mt-8">
        <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-foreground/40">
          Glitches
        </div>
        {diagQ.data && diagQ.data.glitches.length > 0 ? (
          <div className="mt-3 grid grid-cols-2 gap-3">
            {diagQ.data.glitches.map((g) => (
              <GlitchCard key={g.id} glitch={g} />
            ))}
          </div>
        ) : (
          <p className="mt-3 text-[12px] text-foreground/35">Sin glitches registrados.</p>
        )}
      </div>

      {/* Sessions */}
      <div className="mt-8">
        <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-foreground/40">
          Sessions
        </div>
        <div className="mt-3 border border-foreground/5">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-foreground/5 text-[10px] uppercase tracking-[0.22em] text-foreground/40">
                <th className="px-4 py-2.5 font-normal">Title</th>
                <th className="px-4 py-2.5 font-normal">Date</th>
                <th className="px-4 py-2.5 font-normal text-right">Friction</th>
                <th className="px-4 py-2.5 font-normal">Encauzada</th>
                <th className="px-4 py-2.5 font-normal">Status</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((s) => (
                <tr
                  key={s.id}
                  onClick={() => onSelectSession(s.id)}
                  className="cursor-pointer border-b border-foreground/5 text-[13px] last:border-0 hover:bg-foreground/[0.03]"
                >
                  <td className="px-4 py-2.5 text-foreground">{s.title}</td>
                  <td className="px-4 py-2.5 font-mono text-[11px] text-foreground/40">
                    {new Date(s.created_at).toISOString().slice(0, 10)}
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono">
                    {s.friction_level.toFixed(1)}
                  </td>
                  <td className="px-4 py-2.5">
                    {s.encauzamiento_count > 0 ? (
                      <span className="text-[var(--accent)]">✓ {s.encauzamiento_count}</span>
                    ) : (
                      <span className="text-foreground/30">—</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 font-mono text-[10px] uppercase tracking-[0.22em] text-foreground/60">
                    {s.status}
                  </td>
                </tr>
              ))}
              {sessions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-[12px] text-foreground/40">
                    Sin sesiones.
                  </td>
                </tr>
              ) : null}
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
  const healthy = glitch.score >= 5;
  return (
    <div
      className={[
        "flex gap-3 border p-4",
        healthy ? "border-[var(--accent)]/30" : "border-yellow-500/30",
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
            score {glitch.score.toFixed(1)}
          </span>
        </div>
      </div>
    </div>
  );
}

function TelemetryPanel({ s }: { s: SessionRecord }) {
  const rows: Array<[string, React.ReactNode]> = [
    ["Max Friction", s.friction_level.toFixed(1)],
    ["Calcification Δ", s.calcification_delta],
    ["Intervals", s.interval_count],
    ["Glitches", s.glitch_count],
    ["Encauzamientos", s.encauzamiento_count],
    ["Coupling Node", s.coupling_node_triggered ? "Triggered" : "—"],
    ["Resolution", s.resolution_status],
    ["Gold Status", s.gold_extraction_status],
    [
      "Integration",
      s.integration_signal_received_at
        ? new Date(s.integration_signal_received_at).toISOString().slice(0, 16).replace("T", " ")
        : "—",
    ],
  ];
  return (
    <dl className="mt-4 divide-y divide-foreground/5 border border-foreground/5">
      {rows.map(([k, v]) => (
        <div key={k} className="flex items-center justify-between px-4 py-2.5">
          <dt className="text-[11px] uppercase tracking-[0.22em] text-foreground/45">{k}</dt>
          <dd className="font-mono text-[13px] text-foreground">{v}</dd>
        </div>
      ))}
    </dl>
  );
}