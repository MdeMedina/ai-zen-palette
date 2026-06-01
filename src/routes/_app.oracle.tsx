import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { ArrowUp, Plus, RotateCcw } from "lucide-react";
import { chatApi, sessionsApi } from "@/lib/api";
import type { ChatMessage, SessionRecord } from "@/lib/api/types";
import { useSessionStore } from "@/stores/session";
import { DialecticThread } from "@/components/brand/DialecticThread";
import { LangToggle } from "@/components/brand/LangToggle";

export const Route = createFileRoute("/_app/oracle")({
  head: () => ({ meta: [{ title: "PKGD OS · Oracle Workspace" }] }),
  component: OraclePage,
});

type Mode = "new" | "open" | "closed";

function OraclePage() {
  const user = useSessionStore((s) => s.user)!;
  const language = useSessionStore((s) => s.chatLanguage);
  const qc = useQueryClient();

  const sessionsQ = useQuery({
    queryKey: ["my-sessions", user.id],
    queryFn: () => sessionsApi.mySessions(user.id),
  });

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [awaiting, setAwaiting] = useState(false);
  const taRef = useRef<HTMLTextAreaElement>(null);

  const selected = sessionsQ.data?.find((s) => s.id === sessionId) ?? null;
  const mode: Mode = !selected ? "new" : selected.status === "Open" ? "open" : "closed";

  // Load transcript when switching session
  useEffect(() => {
    if (!selected) {
      setMessages([]);
      return;
    }
    setMessages(selected.transcript_payload);
  }, [selected?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const createSession = useMutation({
    mutationFn: (title: string) =>
      sessionsApi.createSession({ title }, user.id),
  });

  const reopenM = useMutation({
    mutationFn: sessionsApi.reopenSession,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["my-sessions", user.id] }),
  });

  const send = useMutation({
    mutationFn: chatApi.sendPrompt,
    onSuccess: (reply) => {
      setMessages((m) => [...m, reply]);
      setAwaiting(false);
      qc.invalidateQueries({ queryKey: ["my-sessions", user.id] });
    },
    onError: () => setAwaiting(false),
  });

  const submit = async () => {
    const text = draft.trim();
    if (!text) return;
    setDraft("");
    let sid = sessionId;
    if (!sid) {
      const s = await createSession.mutateAsync(text.slice(0, 64));
      sid = s.id;
      setSessionId(sid);
      qc.invalidateQueries({ queryKey: ["my-sessions", user.id] });
    }
    const userMsg = chatApi.appendLocalUserMessage(sid, text);
    setMessages((m) => [...m, userMsg]);
    setAwaiting(true);
    send.mutate({ session_id: sid, prompt: text, language });
  };

  const onKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      submit();
    }
  };

  const startNew = () => {
    setSessionId(null);
    setMessages([]);
    setDraft("");
    setTimeout(() => taRef.current?.focus(), 0);
  };

  return (
    <div className="flex h-screen w-full">
      <SessionsSidebar
        sessions={sessionsQ.data ?? []}
        selectedId={sessionId}
        onSelect={setSessionId}
        onNew={startNew}
      />

      <div className="flex h-screen flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-foreground/5 px-8 py-4">
          <div className="flex items-center gap-3">
            <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-foreground/40">
              Oracle Workspace
            </span>
            {selected ? (
              <>
                <span className="text-foreground/15">/</span>
                <span className="text-[13px] text-foreground/80">{selected.title}</span>
                <StatusBadge session={selected} />
              </>
            ) : (
              <span className="text-[13px] text-foreground/40">· New thread</span>
            )}
          </div>
          <LangToggle />
        </header>

        <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col overflow-hidden px-6">
          <DialecticThread
            messages={messages}
            awaiting={awaiting}
            emptyHint="Speak. The Oracle does not introduce itself."
          />
        </div>

        <div className="border-t border-foreground/5 bg-background">
          <div className="mx-auto flex w-full max-w-3xl items-end gap-3 px-6 py-5">
            {mode === "closed" ? (
              <button
                type="button"
                onClick={() => selected && reopenM.mutate(selected.id)}
                disabled={reopenM.isPending}
                className="flex w-full items-center justify-between border border-[var(--accent)] px-5 py-3 text-[12px] uppercase tracking-[0.28em] text-foreground transition-colors hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)] disabled:opacity-40"
              >
                <span className="flex items-center gap-2">
                  <RotateCcw className="size-3.5" strokeWidth={1.5} />
                  {reopenM.isPending ? "Reabriendo…" : "Abrir conversación"}
                </span>
                <span className="font-mono text-[10px] opacity-60">›</span>
              </button>
            ) : (
              <>
                <textarea
                  ref={taRef}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={onKey}
                  rows={1}
                  placeholder="Propose an operative move. ⌘/Ctrl + Enter to send."
                  className="min-h-[44px] flex-1 resize-none border border-foreground/10 bg-[var(--card)]/40 px-4 py-3 text-[14px] text-foreground outline-none transition-colors placeholder:text-foreground/30 focus:border-[var(--accent)]/40"
                />
                <button
                  type="button"
                  onClick={submit}
                  disabled={!draft.trim() || awaiting}
                  className="grid size-11 place-items-center border border-[var(--accent)]/70 text-[var(--accent)] transition-all hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)] disabled:cursor-default disabled:opacity-30"
                  aria-label="Send"
                >
                  <ArrowUp className="size-4" strokeWidth={2} />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SessionsSidebar({
  sessions,
  selectedId,
  onSelect,
  onNew,
}: {
  sessions: SessionRecord[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
}) {
  const sorted = [...sessions].sort((a, b) =>
    (b.updated_at ?? b.created_at).localeCompare(a.updated_at ?? a.created_at),
  );
  const groups: Array<{ key: string; label: string; items: SessionRecord[] }> = [
    { key: "open", label: "Activas", items: sorted.filter((s) => s.status === "Open") },
    {
      key: "enc",
      label: "Encauzadas",
      items: sorted.filter((s) => s.status !== "Open" && s.encauzamiento_count > 0),
    },
    {
      key: "closed",
      label: "Cerradas",
      items: sorted.filter((s) => s.status !== "Open" && s.encauzamiento_count === 0),
    },
  ];

  return (
    <aside className="flex h-screen w-[260px] flex-col border-r border-foreground/5 bg-[var(--card)]/30">
      <div className="flex items-center justify-between border-b border-foreground/5 px-4 py-4">
        <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-foreground/45">
          Conversaciones
        </span>
        <button
          type="button"
          onClick={onNew}
          aria-label="Nueva conversación"
          className="inline-flex items-center gap-1 border border-[var(--accent)]/60 px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-[var(--accent)] transition-colors hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)]"
        >
          <Plus className="size-3" strokeWidth={2} />
          Nueva
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {groups.map((g) =>
          g.items.length === 0 ? null : (
            <div key={g.key} className="py-2">
              <div className="px-4 py-2 font-mono text-[9px] uppercase tracking-[0.32em] text-foreground/30">
                {g.label}
              </div>
              <ul>
                {g.items.map((s) => {
                  const active = s.id === selectedId;
                  return (
                    <li key={s.id}>
                      <button
                        type="button"
                        onClick={() => onSelect(s.id)}
                        className={[
                          "block w-full border-l-2 px-4 py-3 text-left transition-colors",
                          active
                            ? "border-[var(--accent)] bg-foreground/[0.04]"
                            : "border-transparent hover:bg-foreground/[0.02]",
                        ].join(" ")}
                      >
                        <div className="flex items-center gap-2">
                          <StatusDot session={s} />
                          <span className="truncate text-[13px] text-foreground">
                            {s.title}
                          </span>
                        </div>
                        <div className="mt-1 pl-4 font-mono text-[10px] uppercase tracking-[0.2em] text-foreground/35">
                          {relativeTime(s.updated_at ?? s.created_at)}
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ),
        )}
        {sessions.length === 0 ? (
          <div className="px-4 py-8 text-center text-[12px] text-foreground/35">
            Aún no hay conversaciones.
          </div>
        ) : null}
      </div>
    </aside>
  );
}

function StatusDot({ session }: { session: SessionRecord }) {
  if (session.status === "Open")
    return <span className="inline-block size-2 rounded-full bg-[var(--accent)] glow-accent" />;
  if (session.encauzamiento_count > 0)
    return <span className="inline-block size-2 rounded-full border border-[var(--accent)]" />;
  return <span className="inline-block size-2 rounded-full bg-foreground/20" />;
}

function StatusBadge({ session }: { session: SessionRecord }) {
  if (session.status === "Open") {
    return (
      <span className="ml-1 border border-[var(--accent)]/50 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.22em] text-[var(--accent)]">
        Activa
      </span>
    );
  }
  if (session.encauzamiento_count > 0) {
    return (
      <span className="ml-1 border border-[var(--accent)]/30 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.22em] text-[var(--accent)]/80">
        Encauzada
      </span>
    );
  }
  return (
    <span className="ml-1 border border-foreground/15 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.22em] text-foreground/50">
      Cerrada
    </span>
  );
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "ahora";
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d`;
  return new Date(iso).toISOString().slice(0, 10);
}