interface PageBackgroundProps {
  children: React.ReactNode;
  className?: string;
  showGlow?: boolean;
}

export function PageBackground({ children, className = "", showGlow = true }: PageBackgroundProps) {
  return (
    <div className={`relative grid min-h-screen place-items-center overflow-hidden bg-background ${className}`}>
      {/* Grid background layer */}
      <div aria-hidden className="pointer-events-none absolute inset-0 grid-bg opacity-60" />
      
      {/* Premium accent radial glow */}
      {showGlow && (
        <div
          aria-hidden
          className="pointer-events-none absolute -top-40 left-1/2 size-[640px] -translate-x-1/2 rounded-full"
          style={{
            background:
              "radial-gradient(circle, color-mix(in oklab, var(--foreground) 6%, transparent), transparent 60%)",
          }}
        />
      )}
      
      {/* Content wrapper */}
      <div className="relative z-10 flex w-full flex-col items-center justify-center">
        {children}
      </div>
    </div>
  );
}
