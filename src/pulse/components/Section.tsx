import type { ReactNode } from 'react';
import { usePeriods } from '../state/periods';
import { api } from '../lib/api';
import { useAsync } from '../lib/hooks';
import { useI18n } from '../lib/i18n';

export function SectionHead({ num, title, meta }: { num: string; title: string; meta?: string }) {
  return (
    <div className="sec-head">
      <h2 className="sec-title"><span className="sec-num">{num}</span>{title}</h2>
      {meta && <div className="sec-meta">{meta}</div>}
    </div>
  );
}

/** Nota [IA] generada por n8n para una sección/periodo. */
export function AiNote({ section, brand, kind = 'ia' }: { section: string; brand?: string; kind?: 'ia' | 'warn' | 'info' }) {
  const { a, b, granularity } = usePeriods();
  const { lang, t } = useI18n();
  const { data } = useAsync(
    () => api.notes(section, a, b, lang, brand),
    [section, brand, a, b, lang, granularity],
  );
  const body = data?.[0]?.body;
  if (!body) return null;
  return <div className={`note ${kind}`}>{kind === 'ia' ? null : <strong>{t('Note', 'Nota')}: </strong>}{body}</div>;
}
