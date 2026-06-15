import { AlertTriangle, RotateCcw } from "lucide-react";

interface ErrorBannerProps {
  message: string;
  onRetry?: () => void;
}

/**
 * Inline error banner for mutation failures.
 * Matches the design system: destructive color, monospaced copy, optional retry.
 */
export function ErrorBanner({ message, onRetry }: ErrorBannerProps) {
  return (
    <div
      role="alert"
      className="flex items-start gap-3 border border-destructive/30 bg-[color-mix(in_oklab,var(--destructive)_8%,transparent)] px-4 py-3"
    >
      <AlertTriangle
        className="mt-0.5 size-3.5 shrink-0 text-destructive"
        strokeWidth={1.5}
      />
      <p className="flex-1 font-mono text-[11px] uppercase tracking-[0.18em] text-destructive/90">
        {message}
      </p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex shrink-0 items-center gap-1 font-mono text-[10px] uppercase tracking-[0.22em] text-destructive/70 transition-colors hover:text-destructive"
        >
          <RotateCcw className="size-3" strokeWidth={1.5} />
          Retry
        </button>
      ) : null}
    </div>
  );
}
