import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowUpRight, Check, Gem, Trash2 } from "lucide-react";
import { knowledgeApi } from "@/lib/api";
import type { KnowledgeAsset, UUID } from "@/lib/api/types";
import { PageHeader } from "@/components/brand/PageHeader";
import { ErrorBanner } from "@/components/brand/ErrorBanner";
import { useSessionStore } from "@/stores/session";

export const Route = createFileRoute("/_app/proposals")({
  head: () => {
    const lang = useSessionStore.getState().chatLanguage;
    const title = lang === "es" ? "PKGD OS · Propuestas" : "PKGD OS · Proposals";
    return { meta: [{ title }] };
  },
  component: ProposalsPage,
});

type PropType = "Jewel" | "Gold";

function ProposalsPage() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const language = useSessionStore((s) => s.chatLanguage);
  const es = language === "es";
  const [type, setType] = useState<PropType>("Jewel");

  const proposalsQ = useQuery({
    queryKey: ["proposals", type],
    queryFn: () => knowledgeApi.listProposals(type),
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["proposals", type] });

  const approveM = useMutation({
    mutationFn: (id: UUID) => knowledgeApi.approveProposal(id),
    onSuccess: invalidate,
  });
  const rejectM = useMutation({
    mutationFn: (id: UUID) => knowledgeApi.deleteAsset(id),
    onSuccess: invalidate,
  });

  const pending = (id: UUID) =>
    (approveM.isPending && approveM.variables === id) ||
    (rejectM.isPending && rejectM.variables === id);

  const proposals = proposalsQ.data ?? [];

  return (
    <div className="flex h-screen flex-1 flex-col overflow-hidden">
      <PageHeader
        eyebrow={es ? "Revisión de administrador" : "Admin review"}
        title={es ? "Propuestas pendientes" : "Pending proposals"}
        actions={
          <div className="flex items-center gap-1 rounded-[4px] border border-border p-0.5">
            {(["Jewel", "Gold"] as PropType[]).map((tt) => (
              <button
                key={tt}
                type="button"
                onClick={() => setType(tt)}
                className={[
                  "px-3 py-1.5 text-[10px] font-mono uppercase tracking-[0.22em] transition-colors rounded-[3px]",
                  type === tt
                    ? "bg-[var(--accent)] text-[var(--accent-foreground)]"
                    : "text-foreground/55 hover:text-foreground",
                ].join(" ")}
              >
                {tt === "Jewel" ? (es ? "Joya" : "Jewel") : es ? "Oro" : "Gold"}
              </button>
            ))}
          </div>
        }
      />

      <div className="flex-1 overflow-y-auto px-8 py-6">
        <div className="mx-auto w-full max-w-3xl">
          {proposalsQ.isError ? (
            <ErrorBanner
              message={
                es
                  ? "No se pudieron cargar las propuestas."
                  : "Failed to load proposals."
              }
              onRetry={() => proposalsQ.refetch()}
            />
          ) : null}

          {proposalsQ.isLoading ? (
            <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-foreground/40">
              {es ? "Cargando…" : "Loading…"}
            </p>
          ) : proposals.length === 0 ? (
            <div className="mt-10 flex flex-col items-center gap-3 text-center">
              <Gem className="size-6 text-foreground/25" strokeWidth={1.5} />
              <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-foreground/40">
                {es
                  ? `Sin propuestas de ${type === "Jewel" ? "Joya" : "Oro"} pendientes`
                  : `No pending ${type} proposals`}
              </p>
            </div>
          ) : (
            <ul className="flex flex-col gap-3">
              {proposals.map((p) => (
                <ProposalCard
                  key={p.id}
                  proposal={p}
                  es={es}
                  busy={pending(p.id)}
                  onOpenConversation={
                    p.source_session_id
                      ? () =>
                          navigate({
                            to: "/audit",
                            search: { session: p.source_session_id! },
                          })
                      : undefined
                  }
                  onApprove={() => approveM.mutate(p.id)}
                  onReject={() => {
                    if (
                      typeof window === "undefined" ||
                      window.confirm(
                        es
                          ? `¿Rechazar y eliminar la propuesta «${p.title}»?`
                          : `Reject and delete the proposal "${p.title}"?`,
                      )
                    ) {
                      rejectM.mutate(p.id);
                    }
                  }}
                />
              ))}
            </ul>
          )}

          {approveM.isError || rejectM.isError ? (
            <div className="mt-4">
              <ErrorBanner
                message={
                  es
                    ? "La acción falló. La propuesta pudo haber sido procesada ya, o el servidor no está disponible."
                    : "The action failed — the proposal may already be processed, or the server is unavailable."
                }
              />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function ProposalCard({
  proposal,
  es,
  busy,
  onOpenConversation,
  onApprove,
  onReject,
}: {
  proposal: KnowledgeAsset;
  es: boolean;
  busy: boolean;
  onOpenConversation?: () => void;
  onApprove: () => void;
  onReject: () => void;
}) {
  const meta = [
    proposal.brand?.name,
    proposal.department?.name,
    proposal.department_role?.name,
  ].filter(Boolean) as string[];

  const openable = !!onOpenConversation;

  return (
    <li
      onClick={onOpenConversation}
      role={openable ? "button" : undefined}
      tabIndex={openable ? 0 : undefined}
      onKeyDown={
        openable
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onOpenConversation?.();
              }
            }
          : undefined
      }
      title={
        openable
          ? es
            ? "Abrir la conversación donde se desarrolló"
            : "Open the conversation where it was developed"
          : undefined
      }
      className={[
        "group flex flex-col gap-3 border-l border-border bg-[var(--card)] p-4 rounded-[4px] sm:flex-row sm:items-center sm:justify-between transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
        openable
          ? "cursor-pointer hover:border-[var(--accent)] hover:bg-foreground/[0.03]"
          : "",
      ].join(" ")}
    >
      <div className="min-w-0">
        <div className="mb-1 flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.24em] text-[var(--accent)]">
          <span className="border border-[var(--accent)]/40 px-1.5 py-0.5">
            {proposal.asset_type === "Jewel" ? (es ? "Joya" : "Jewel") : es ? "Oro" : "Gold"}
          </span>
          <time className="text-foreground/45">
            {new Date(proposal.created_at).toLocaleDateString()}
          </time>
        </div>
        <p className="flex items-center gap-1.5 truncate text-[14px] text-foreground" title={proposal.title}>
          <span className="truncate">{proposal.title}</span>
          {openable ? (
            <ArrowUpRight
              className="size-3.5 shrink-0 text-foreground/30 transition-colors group-hover:text-[var(--accent)]"
              strokeWidth={2}
            />
          ) : null}
        </p>
        {meta.length > 0 ? (
          <p className="mt-0.5 truncate font-mono text-[10px] uppercase tracking-[0.16em] text-foreground/45">
            {meta.join(" · ")}
          </p>
        ) : null}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={(e) => {
            e.stopPropagation();
            onApprove();
          }}
          className="inline-flex items-center gap-1.5 bg-[var(--accent)] px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--accent-foreground)] transition-opacity hover:opacity-90 disabled:opacity-30"
        >
          <Check className="size-3" strokeWidth={2.5} />
          {es ? "Aprobar" : "Approve"}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={(e) => {
            e.stopPropagation();
            onReject();
          }}
          className="inline-flex items-center gap-1.5 border border-destructive/50 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-destructive transition-colors hover:bg-destructive hover:text-background disabled:opacity-30"
        >
          <Trash2 className="size-3" strokeWidth={2} />
          {es ? "Rechazar" : "Reject"}
        </button>
      </div>
    </li>
  );
}
