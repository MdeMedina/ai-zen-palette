import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { ArrowUp, Plus, RotateCcw } from "lucide-react";
import { chatApi, sessionsApi } from "@/lib/api";
import type { ChatMessage, SessionRecord } from "@/lib/api/types";
import { useSessionStore, type ChatLanguage } from "@/stores/session";
import { DialecticThread } from "@/components/brand/DialecticThread";
import { LangToggle } from "@/components/brand/LangToggle";
import { oracleCopy } from "@/lib/i18n/oracle";

export const Route = createFileRoute("/_app/oracle")({
  head: () => {
    const lang = useSessionStore.getState().chatLanguage;
    const title =
      lang === "es" ? "PKGD OS · Espacio de Conversación" : "PKGD OS · Conversation Space";
    return { meta: [{ title }] };
  },
  component: OraclePage,
});

type Mode = "new" | "open" | "closed";

function OraclePage() {
  const user = useSessionStore((s) => s.user)!;
  const language = useSessionStore((s) => s.chatLanguage);
  const t = oracleCopy(language);
  const qc = useQueryClient();

  const sessionsQ = useQuery({
    queryKey: ["my-sessions", user.id],
    queryFn: () => sessionsApi.mySessions(user.id),
  });

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [awaiting, setAwaiting] = useState<string | null>(null);
  const [composerError, setComposerError] = useState<
    { kind: "create"; scope: null } | { kind: "send"; scope: string; prompt: string } | null
  >(null);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const sessionIdRef = useRef<string | null>(null);
  sessionIdRef.current = sessionId;

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
    mutationFn: ({ title, prompt }: { title: string; prompt: string }) =>
      sessionsApi.createSession({ title, prompt }, user.id),
  });

  const reopenM = useMutation({
    mutationFn: sessionsApi.reopenSession,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["my-sessions", user.id] }),
  });

  const send = useMutation({
    mutationFn: chatApi.sendPrompt,
    onSuccess: (reply, variables) => {
      if (variables.session_id === sessionIdRef.current) {
        const { concepto_entry, ...msg } = reply;
        setMessages((m) => [...m, msg, ...(concepto_entry ? [concepto_entry] : [])]);
      }
      setAwaiting((a) => (a === variables.session_id ? null : a));
      qc.invalidateQueries({ queryKey: ["my-sessions", user.id] });
    },
    onError: (_err, variables) => {
      setAwaiting((a) => (a === variables.session_id ? null : a));
      setComposerError({ kind: "send", scope: variables.session_id, prompt: variables.prompt });
    },
  });

  const submitPrompt = async (text: string) => {
    let sid = sessionId;
    if (!sid) {
      try {
        const s = await createSession.mutateAsync({ title: text.slice(0, 64), prompt: text });
        sid = s.id;
        sessionIdRef.current = sid;
        setSessionId(sid);
        qc.invalidateQueries({ queryKey: ["my-sessions", user.id] });
      } catch {
        setDraft(text);
        setComposerError({ kind: "create", scope: null });
        return;
      }
    } else {
      setComposerError(null);
      const userMsg = chatApi.appendLocalUserMessage(sid, text);
      setMessages((m) => [...m, userMsg]);
    }
    setComposerError(null);
    setAwaiting(sid);
    send.mutate({ session_id: sid, prompt: text, language });
  };

  const submit = () => {
    const text = draft.trim();
    if (!text || awaiting !== null) return;
    setDraft("");
    setComposerError(null);
    void submitPrompt(text);
  };

  const retry = () => {
    if (!composerError || composerError.kind !== "send" || awaiting !== null) return;
    const { prompt } = composerError;
    setComposerError(null);
    void submitPrompt(prompt);
  };

  const onKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (awaiting === null) {
        submit();
      }
    }
  };

  const startNew = () => {
    setSessionId(null);
    setMessages([]);
    setDraft("");
    setComposerError(null);
    setTimeout(() => taRef.current?.focus(), 0);
  };

  return (
    <div className="flex h-full w-full">
      <SessionsSidebar
        sessions={sessionsQ.data ?? []}
        selectedId={sessionId}
        onSelect={setSessionId}
        onNew={startNew}
        language={language}
        isLoading={sessionsQ.isLoading}
        isError={sessionsQ.isError}
        refetch={() => sessionsQ.refetch()}
      />

      <div className="flex h-screen flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-border px-8">
          <div className="flex items-center gap-3">
            <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-foreground/55">
              {t.workspaceTitle}
            </span>
            {selected ? (
              <>
                <span className="text-foreground/55">/</span>
                <span className="text-[13px] text-foreground/80">{selected.title}</span>
                <StatusBadge session={selected} language={language} />
              </>
            ) : (
              <span className="text-[13px] text-foreground/55">{t.newThread}</span>
            )}
          </div>
          <LangToggle />
        </header>

        <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col overflow-hidden px-6">
          <DialecticThread
            messages={messages}
            awaiting={awaiting !== null && awaiting === sessionId}
            emptyHint={t.emptyHint}
            language={language}
          />
        </div>

        <div className="border-t border-border bg-background">
          {composerError && composerError.scope === sessionId ? (
            <div
              role="alert"
              className="mx-auto flex w-full max-w-3xl items-center justify-between gap-3 px-6 pt-4 text-sm text-destructive"
            >
              {composerError.kind === "create" ? (
                <span>{t.createError}</span>
              ) : (
                <>
                  <span>{t.sendError}</span>
                  <button
                    type="button"
                    onClick={retry}
                    className="shrink-0 underline-offset-4 transition-colors hover:underline"
                  >
                    {t.retry}
                  </button>
                </>
              )}
            </div>
          ) : null}
          <div className="mx-auto flex w-full max-w-3xl items-end gap-3 px-6 py-5">
            {mode === "closed" ? (
              <div className="flex w-full flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border border-[var(--accent)]/30 bg-[var(--card)] p-4 rounded-[4px] shadow-sm motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-3 w-full">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--accent)] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--accent)]"></span>
                  </span>
                  <span className="text-[13px] text-foreground/80 font-medium">
                    {language === "es"
                      ? "Esta idea se guardó en nuestro registro de oro"
                      : "This idea was saved in our Gold Registry"}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => selected && reopenM.mutate(selected.id)}
                  disabled={reopenM.isPending}
                  className="inline-flex items-center justify-between border border-[var(--accent)] px-4 py-2 text-[11px] uppercase tracking-[0.2em] text-[var(--accent)] transition-colors hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)] disabled:opacity-40 font-semibold"
                >
                  <span className="flex items-center gap-1.5">
                    <RotateCcw className="size-3" strokeWidth={2} />
                    {reopenM.isPending
                      ? language === "es"
                        ? "Reabriendo..."
                        : "Reopening..."
                      : language === "es"
                        ? "Reabrir conversación"
                        : "Reopen conversation"}
                  </span>
                </button>
              </div>
            ) : (
              <>
                <textarea
                  ref={taRef}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={onKey}
                  rows={1}
                  placeholder={t.composerPlaceholder}
                  className="min-h-[44px] flex-1 resize-none border border-border bg-[var(--card)]/40 px-4 py-3 text-[14px] text-foreground outline-none transition-colors placeholder:text-foreground/25 focus:border-[var(--accent)]/40"
                />
                <button
                  type="button"
                  onClick={submit}
                  disabled={!draft.trim() || awaiting !== null}
                  className="grid size-11 place-items-center border border-[var(--accent)]/70 text-[var(--accent)] transition-all hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)] disabled:cursor-default disabled:opacity-40"
                  aria-label={t.send}
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
  language,
  isLoading,
  isError,
  refetch,
}: {
  sessions: SessionRecord[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  language: ChatLanguage;
  isLoading?: boolean;
  isError?: boolean;
  refetch?: () => void;
}) {
  const t = oracleCopy(language);
  const sorted = [...sessions].sort((a, b) =>
    (b.updated_at ?? b.created_at).localeCompare(a.updated_at ?? a.created_at),
  );
  const groups: Array<{ key: string; label: string; items: SessionRecord[] }> = [
    { key: "open", label: t.groupActive, items: sorted.filter((s) => s.status === "Open") },
    {
      key: "enc",
      label: t.groupFollowUp,
      items: sorted.filter((s) => s.status !== "Open" && s.encauzamiento_count > 0),
    },
    {
      key: "closed",
      label: t.groupClosed,
      items: sorted.filter((s) => s.status !== "Open" && s.encauzamiento_count === 0),
    },
  ];

  return (
    <aside className="flex h-screen w-[260px] flex-col border-r border-border bg-conversation-sidebar">
      <div className="flex h-16 items-center justify-between border-b border-border px-4">
        <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-foreground/55">
          {t.conversations}
        </span>
        <button
          type="button"
          onClick={onNew}
          aria-label={t.newConversationAria}
          className="inline-flex items-center gap-1 border border-[var(--accent)]/60 px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-[var(--accent)] transition-colors hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <Plus className="size-3" strokeWidth={2} />
          {t.newConversation}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-4 space-y-4">
            <div className="h-2 w-16 bg-foreground/10 animate-pulse rounded" />
            <div className="space-y-3">
              <div className="h-10 bg-foreground/5 animate-pulse rounded-[3px]" />
              <div className="h-10 bg-foreground/5 animate-pulse rounded-[3px]" />
              <div className="h-10 bg-foreground/5 animate-pulse rounded-[3px]" />
            </div>
          </div>
        ) : isError ? (
          <div className="p-4 text-center space-y-3">
            <div className="text-[12px] text-destructive">
              {t.sendError || "Failed to load history"}
            </div>
            {refetch && (
              <button
                type="button"
                onClick={refetch}
                className="text-[11px] underline text-foreground/60 hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {t.retry || "Retry"}
              </button>
            )}
          </div>
        ) : (
          <>
            {groups.map((g) =>
              g.items.length === 0 ? null : (
                <div key={g.key} className="py-2">
                  <div className="px-4 py-2 font-mono text-[9px] uppercase tracking-[0.32em] text-foreground/55">
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
                              "block w-full border-l-2 px-4 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                              active
                                ? "border-[var(--accent)] bg-foreground/[0.04]"
                                : "border-transparent hover:bg-foreground/[0.02]",
                            ].join(" ")}
                          >
                            <div className="flex items-center gap-2">
                              <StatusDot session={s} language={language} />
                              <span className="truncate text-[13px] text-foreground">
                                {s.title || "Untitled"}
                              </span>
                            </div>
                            <div className="mt-1 pl-4 font-mono text-[10px] uppercase tracking-[0.2em] text-foreground/55">
                              {relativeTime(s.updated_at ?? s.created_at, t.timeNow)}
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
              <div className="px-4 py-8 text-center text-[12px] text-foreground/55">
                {t.noConversations}
              </div>
            ) : null}
          </>
        )}
      </div>
    </aside>
  );
}

function StatusDot({ session, language }: { session: SessionRecord; language: ChatLanguage }) {
  const t = oracleCopy(language);
  if (session.status === "Open")
    return (
      <span
        title={t.statusActive}
        aria-label={t.statusActive}
        className="inline-block size-2 rounded-full bg-[var(--accent)] glow-accent"
      />
    );
  if (session.encauzamiento_count > 0)
    return (
      <span
        title={t.statusFollowUp}
        aria-label={t.statusFollowUp}
        className="inline-block size-2 rounded-full border border-[var(--accent)]"
      />
    );
  return (
    <span
      title={t.statusClosed}
      aria-label={t.statusClosed}
      className="inline-block size-2 rounded-full bg-foreground/20"
    />
  );
}

function StatusBadge({ session, language }: { session: SessionRecord; language: ChatLanguage }) {
  const t = oracleCopy(language);
  if (session.status === "Open") {
    return (
      <span className="ml-1 border border-[var(--accent)]/50 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.22em] text-[var(--accent)]">
        {t.statusActive}
      </span>
    );
  }
  if (session.encauzamiento_count > 0) {
    return (
      <span className="ml-1 border border-[var(--accent)]/30 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.22em] text-[var(--accent)]/80">
        {t.statusFollowUp}
      </span>
    );
  }
  return (
    <span className="ml-1 border border-foreground/15 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.22em] text-foreground/55">
      {t.statusClosed}
    </span>
  );
}

function relativeTime(iso: string, now: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return now;
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d`;
  return new Date(iso).toISOString().slice(0, 10);
}
