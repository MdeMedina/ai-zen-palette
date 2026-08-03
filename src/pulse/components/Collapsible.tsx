import { useState, type ReactNode } from 'react';

/**
 * Sección colapsable (dropdown). Cerrada por defecto; el header alterna el cuerpo.
 * Reemplaza el patrón <section><SectionHead/>…</section> para que toda la info
 * quede oculta hasta que el usuario abra la sección.
 */
export function Collapsible({
  num,
  title,
  meta,
  defaultOpen = false,
  children,
}: {
  num?: string;
  title: string;
  meta?: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="section">
      <button className="sec-toggle" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <h2 className="sec-title">
          {num && <span className="sec-num">{num}</span>}
          {title}
        </h2>
        <div className="sec-toggle-right">
          {meta && <span className="sec-meta">{meta}</span>}
          <span className={`sec-caret ${open ? 'open' : ''}`} aria-hidden>▾</span>
        </div>
      </button>
      {open && <div className="sec-body">{children}</div>}
    </section>
  );
}
