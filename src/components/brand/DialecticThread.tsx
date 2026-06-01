import { useEffect, useRef } from "react";
import type { ChatMessage } from "@/lib/api/types";
import { MessageBubble } from "./MessageBubble";
import { IntervalIndicator } from "./IntervalIndicator";

export function DialecticThread({
  messages,
  awaiting = false,
  emptyHint,
}: {
  messages: ChatMessage[];
  awaiting?: boolean;
  emptyHint?: string;
}) {
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
        <div className="m-auto max-w-md text-center text-sm text-foreground/40">
          {emptyHint}
        </div>
      ) : null}
      {messages.map((m) => (
        <MessageBubble key={m.id} message={m} />
      ))}
      {awaiting ? (
        <div
          className="transition-opacity duration-700"
          style={{ opacity: awaiting ? 0.6 : 1 }}
        >
          <IntervalIndicator />
        </div>
      ) : null}
    </div>
  );
}