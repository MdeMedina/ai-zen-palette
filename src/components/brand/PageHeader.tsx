import React from "react";

interface PageHeaderProps {
  eyebrow: string;
  title: string;
  actions?: React.ReactNode;
}

export function PageHeader({ eyebrow, title, actions }: PageHeaderProps) {
  return (
    <header className="flex items-center justify-between gap-4 border-b border-border px-8 py-5">
      <div className="min-w-0 flex-1">
        <div
          className="font-mono text-[10px] uppercase tracking-[0.32em] text-foreground/40 truncate"
          title={eyebrow}
        >
          {eyebrow}
        </div>
        <h1
          className="mt-1 font-display text-[22px] tracking-tight text-foreground truncate"
          title={title}
        >
          {title}
        </h1>
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </header>
  );
}
