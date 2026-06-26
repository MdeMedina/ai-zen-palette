import { useEffect, useRef } from "react";
import type { ChatMessage } from "@/lib/api/types";
import type { ChatLanguage } from "@/stores/session";
import { oracleCopy } from "@/lib/i18n/oracle";
import { MessageBubble } from "./MessageBubble";
import { MarkdownRenderer } from "./MarkdownRenderer";
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

  // El "concepto" no es un mensaje del diálogo: se pinta como resumen de Oro al
  // final de la sesión cerrada (centrado, fondo amarillo).
  const bubbles = messages.filter((m) => m.role !== "concepto");
  const conceptos = messages.filter((m) => m.role === "concepto");

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
      {bubbles.map((m) => (
        <MessageBubble key={m.id} message={m} language={language} />
      ))}
      {awaiting ? (
        <div className="opacity-60 transition-opacity duration-700">
          <IntervalIndicator />
        </div>
      ) : null}
      {conceptos.map((c) => (
        <ConceptoSummary key={c.id} concepto={c} language={language} />
      ))}
      <p role="status" className="sr-only">
        {awaiting ? t.awaitingStatus : ""}
      </p>
    </div>
  );
}

function ConceptoSummary({
  concepto,
  language,
}: {
  concepto: ChatMessage;
  language: ChatLanguage;
}) {
  return (
    <div className="mx-auto my-4 w-full max-w-2xl motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-3">
      <div className="bg-[#fae714] text-black rounded-[4px] px-6 py-5 shadow-sm">
        <div className="mb-3 text-center font-mono text-[10px] uppercase tracking-[0.28em] text-black/70">
          {language === "es" ? "Oro Estructural · Resumen" : "Structural Gold · Summary"}
        </div>
        {concepto.title ? (
          <h3 className="mb-3 text-center text-[18px] font-bold leading-tight">
            {concepto.title}
          </h3>
        ) : null}
        <div className="concepto-md text-left text-[14px] leading-[1.6]">
          <MarkdownRenderer content={concepto.text} />
        </div>
      </div>
    </div>
  );
}
