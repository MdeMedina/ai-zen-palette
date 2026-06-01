import type { ChatMessage } from "@/lib/api/types";

export function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  return (
    <div className={`group flex w-full ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={[
          "max-w-[78%] px-4 py-3 text-[15px] leading-[1.55]",
          isUser
            ? "border-l-2 border-[var(--accent)] bg-[color-mix(in_oklab,var(--accent)_6%,transparent)] text-foreground"
            : "border-l border-foreground/10 text-foreground/95",
        ].join(" ")}
      >
        <div className="mb-1 flex items-center gap-2 text-[10px] uppercase tracking-[0.24em] text-foreground/40">
          <span>{isUser ? "Operator" : "AI · CEO"}</span>
          <span className="text-foreground/20">·</span>
          <time>{new Date(message.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</time>
        </div>
        <p className="whitespace-pre-wrap">{message.text}</p>
      </div>
    </div>
  );
}