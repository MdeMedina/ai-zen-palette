export function PassivePulse({ className = "" }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={`inline-block size-1.5 rounded-full bg-[var(--accent)] pulse-passive ${className}`}
    />
  );
}