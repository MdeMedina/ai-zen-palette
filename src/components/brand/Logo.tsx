export function BrandLogo({ className }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 font-sonoran ${className ?? ""}`}>
      <span
        aria-hidden
        className="inline-block size-2.5 rounded-[2px] bg-[var(--accent)] glow-accent"
      />
      <span className="tracking-[0.18em] text-xs uppercase text-foreground/90">
        PKGD<span className="text-[var(--accent)]"> · </span>OS
      </span>
    </div>
  );
}
