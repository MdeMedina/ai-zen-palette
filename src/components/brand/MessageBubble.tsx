import type { ChatMessage } from "@/lib/api/types";
import type { ChatLanguage } from "@/stores/session";
import { oracleCopy } from "@/lib/i18n/oracle";

export function MessageBubble({
  message,
  language,
}: {
  message: ChatMessage;
  language: ChatLanguage;
}) {
  const isUser = message.role === "user";
  const t = oracleCopy(language);
  return (
    <div className={`group flex w-full ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={[
          "max-w-[78%] px-4 py-3 text-[15px] leading-[1.55]",
          isUser
            ? "border-l-2 border-[var(--accent)] bg-[#fefbe6] dark:bg-[color-mix(in_oklab,var(--accent)_6%,transparent)] text-foreground"
            : "border-l border-border bg-foreground/[0.03] dark:bg-transparent text-foreground/95",
        ].join(" ")}
      >
        <div className="mb-1 flex items-center gap-2 text-[10px] uppercase tracking-[0.24em] text-foreground/55">
          <span>{isUser ? t.roleOperator : t.roleAi}</span>
          <span className="text-foreground/55">·</span>
          <time>
            {new Date(message.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </time>
        </div>
        <p className="whitespace-pre-wrap">{message.text}</p>
      </div>
    </div>
  );
}
