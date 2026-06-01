import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { ArrowUp } from "lucide-react";
import { brandsApi, chatApi, sessionsApi } from "@/lib/api";
import type { ChatMessage } from "@/lib/api/types";
import { useSessionStore } from "@/stores/session";
import { DialecticThread } from "@/components/brand/DialecticThread";
import { LangToggle } from "@/components/brand/LangToggle";

export const Route = createFileRoute("/_app/oracle")({
  head: () => ({ meta: [{ title: "PKGD OS · Oracle Workspace" }] }),
  component: OraclePage,
});

function OraclePage() {
  const user = useSessionStore((s) => s.user)!;
  const language = useSessionStore((s) => s.chatLanguage);
  const qc = useQueryClient();

  const brandsQ = useQuery({ queryKey: ["brands"], queryFn: brandsApi.listBrands });
  const [brandId, setBrandId] = useState<string | null>(null);

  useEffect(() => {
    if (!brandId && brandsQ.data?.[0]) setBrandId(brandsQ.data[0].id);
  }, [brandsQ.data, brandId]);

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [awaiting, setAwaiting] = useState(false);
  const taRef = useRef<HTMLTextAreaElement>(null);

  const createSession = useMutation({
    mutationFn: (title: string) =>
      sessionsApi.createSession({ brand_id: brandId!, title }, user.id),
  });

  const send = useMutation({
    mutationFn: chatApi.sendPrompt,
    onSuccess: (reply) => {
      setMessages((m) => [...m, reply]);
      setAwaiting(false);
      qc.invalidateQueries({ queryKey: ["my-sessions"] });
    },
    onError: () => setAwaiting(false),
  });

  const submit = async () => {
    const text = draft.trim();
    if (!text || !brandId) return;
    setDraft("");
    let sid = sessionId;
    if (!sid) {
      const s = await createSession.mutateAsync(text.slice(0, 64));
      sid = s.id;
      setSessionId(sid);
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

  return (
    <div className="flex h-screen flex-col">
      <header className="flex items-center justify-between border-b border-foreground/5 px-8 py-4">
        <div className="flex items-center gap-4">
          <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-foreground/40">
            Oracle Workspace
          </span>
          <span className="text-foreground/15">/</span>
          <select
            value={brandId ?? ""}
            onChange={(e) => setBrandId(e.target.value)}
            className="bg-transparent text-[13px] text-foreground/80 outline-none"
          >
            {brandsQ.data?.map((b) => (
              <option key={b.id} value={b.id} className="bg-background">
                {b.name}
              </option>
            ))}
          </select>
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
        </div>
      </div>
    </div>
  );
}