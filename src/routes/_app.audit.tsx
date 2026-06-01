import { createFileRoute, useSearch } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { z } from "zod";
import { knowledgeApi, sessionsApi, usersApi } from "@/lib/api";
import type { SessionRecord } from "@/lib/api/types";
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

  const sessionsQ = useQuery({ queryKey: ["all-sessions"], queryFn: sessionsApi.listAllSessions });
  const operatorsQ = useQuery({ queryKey: ["operators"], queryFn: usersApi.listOperators });

  const [selectedId, setSelectedId] = useState<string | null>(null);
  useEffect(() => {
    if (!selectedId && sessionsQ.data?.[0]) {
      setSelectedId(search.session ?? sessionsQ.data[0].id);
    }
  }, [sessionsQ.data, selectedId, search.session]);

  const selected = sessionsQ.data?.find((s) => s.id === selectedId) ?? null;

  const integrateM = useMutation({
    mutationFn: async (id: string) => {
      await sessionsApi.integrateSession(id);
      await knowledgeApi.extractGold(id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["all-sessions"] }),
  });

  const operatorName = (uid: string) =>
    operatorsQ.data?.find((o) => o.id === uid)?.full_name ?? "—";

  return (
    <div className="flex h-screen flex-col">
      <PageHeader eyebrow="Directorate" title="Audit Workspace" />
      {search.alert === "structural_gold" ? (
        <DeepLinkBanner message="High Probability of Structural Gold Detected!" />
      ) : null}

      <div className="grid flex-1 grid-cols-[280px_1fr_320px] overflow-hidden">
        <aside className="overflow-y-auto border-r border-foreground/5">
          <div className="px-5 py-4 font-mono text-[10px] uppercase tracking-[0.28em] text-foreground/40">
            Sessions
          </div>
          <ul>
            {sessionsQ.data?.map((s) => {
              const active = s.id === selectedId;
              return (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(s.id)}
                    className={[
                      "block w-full border-l-2 px-5 py-3 text-left transition-colors",
                      active
                        ? "border-[var(--accent)] bg-foreground/[0.03]"
                        : "border-transparent hover:bg-foreground/[0.02]",
                    ].join(" ")}
                  >
                    <div className="text-[13px] text-foreground">{s.title}</div>
                    <div className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.2em] text-foreground/40">
                      {operatorName(s.user_id)} · F{s.friction_level}
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </aside>

        <section className="flex flex-col overflow-hidden border-r border-foreground/5">
          <div className="px-6 py-4">
            <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-foreground/40">
              Dialectic Thread · Read-Only
            </div>
            <div className="mt-0.5 text-[15px] text-foreground">{selected?.title ?? "—"}</div>
          </div>
          <div className="flex-1 overflow-hidden px-6">
            {selected ? (
              <DialecticThread messages={selected.transcript_payload} emptyHint="No transcript." />
            ) : null}
          </div>
        </section>

        <aside className="overflow-y-auto p-6">
          <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-foreground/40">
            Session Telemetry
          </div>
          {selected ? <TelemetryPanel s={selected} /> : null}

          <button
            type="button"
            disabled={!selected || integrateM.isPending}
            onClick={() => selected && integrateM.mutate(selected.id)}
            className="mt-6 inline-flex w-full items-center justify-between bg-[var(--accent)] px-4 py-3 text-[11px] uppercase tracking-[0.24em] text-[var(--accent-foreground)] transition-opacity hover:opacity-90 disabled:opacity-30"
          >
            <span>Approve &amp; Extract Structural Gold</span>
            <span className="font-mono text-[10px]">›</span>
          </button>
        </aside>
      </div>
    </div>
  );
}

function TelemetryPanel({ s }: { s: SessionRecord }) {
  const rows: Array<[string, React.ReactNode]> = [
    ["Max Friction", s.friction_level],
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