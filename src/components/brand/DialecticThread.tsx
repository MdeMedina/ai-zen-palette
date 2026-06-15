import { useEffect, useRef } from "react";
import type { ChatMessage } from "@/lib/api/types";
import type { ChatLanguage } from "@/stores/session";
import { oracleCopy } from "@/lib/i18n/oracle";
import { MessageBubble } from "./MessageBubble";
import { IntervalIndicator } from "./IntervalIndicator";

export function DialecticThread({
  messages,
  awaiting = false,
  emptyHint,
  language,
}: {
  messages: ChatMessage[];
  awaiting?: boolean;
  emptyHint?: string;
  language: ChatLanguage;
}) {
  const t = oracleCopy(language);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.scrollTo({ top: ref.current.scrollHeight, behavior: "smooth" });
  }, [messages.length, awaiting]);

  return (
    <div
      ref={ref}
      className="flex h-full flex-col gap-5 overflow-y-auto px-1 py-6"
      style={{ scrollbarGutter: "stable" }}
    >
      {messages.length === 0 && !awaiting && emptyHint ? (
        <div className="m-auto max-w-md text-center font-mono text-[11px] uppercase tracking-[0.15em] text-foreground/45 select-none">
          [ {emptyHint} ]
        </div>
      ) : null}
      {messages.map((m) => (
        <MessageBubble key={m.id} message={m} language={language} />
      ))}
      {awaiting ? (
        <div className="opacity-60 transition-opacity duration-700">
          <IntervalIndicator />
        </div>
      ) : null}
      <p role="status" className="sr-only">
        {awaiting ? t.awaitingStatus : ""}
      </p>
    </div>
  );
}
