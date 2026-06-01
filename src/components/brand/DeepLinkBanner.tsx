import { AlertTriangle } from "lucide-react";

export function DeepLinkBanner({ message }: { message: string }) {
  return (
    <div className="border-b border-[var(--accent)]/30 bg-[color-mix(in_oklab,var(--accent)_14%,transparent)]">
      <div className="flex items-center gap-3 px-6 py-3 text-[12px] uppercase tracking-[0.22em] text-foreground">
        <AlertTriangle className="size-4 text-[var(--accent)]" strokeWidth={1.5} />
        <span>{message}</span>
      </div>
    </div>
  );
}