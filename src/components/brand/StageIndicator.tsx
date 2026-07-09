import type { TurnProgress } from "@/lib/api/chat";

/**
 * Staged loader shown during "El Intervalo". Austere by design: the deliberate
 * caret, plus the real pipeline stage as it arrives from the backend poll.
 * Falls back to the silent caret alone until the first stage lands.
 */
export function StageIndicator({ progress }: { progress?: TurnProgress | null }) {
  const label = progress?.label;
  const detail = progress?.detail ?? undefined;

  return (
    <div className="flex items-start gap-3 py-3 pl-1">
      <span className="mt-[2px] inline-block h-3 w-[2px] bg-[var(--accent)] caret-blink" />
      <span className="flex flex-col gap-0.5">
        <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-foreground/70 transition-opacity duration-300">
          {label ?? "…"}
        </span>
        {detail ? (
          <span className="text-[12px] font-light leading-snug text-foreground/45 transition-opacity duration-300">
            {detail}
          </span>
        ) : null}
      </span>
    </div>
  );
}
