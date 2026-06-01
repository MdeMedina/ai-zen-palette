export function IntervalIndicator() {
  // "El Intervalo": no spinner, no text — only a deliberate silence cue.
  return (
    <div className="flex items-center gap-2 py-3 pl-1 text-xs uppercase tracking-[0.24em] text-foreground/40">
      <span className="inline-block h-3 w-[2px] bg-[var(--accent)] caret-blink" />
    </div>
  );
}