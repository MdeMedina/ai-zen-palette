import { GRANULARITIES, GRANULARITY_LABELS, CHANNEL_LABELS, labelOf, rangeOf, type Granularity, type Channel } from '@/pulse/shared';
import { usePeriods } from '../state/periods';
import { useI18n } from '../lib/i18n';

/** Selector A/B de dos pasos (doc §1): modalidad + dos periodos concretos. */
export function PeriodSelector() {
  const { granularity, setGranularity, a, b, setA, setB, options, meta } = usePeriods();
  const { lang, t } = useI18n();

  // Canales cuyo histórico EMPIEZA después del periodo A elegido: sus KPIs
  // saldrían en 0 y se leerían como caídas. Instagram y Facebook llegan 13 meses
  // atrás (backfill); el resto solo ~90 días, así que hay que decirlo explícito.
  const aStart = a ? rangeOf({ granularity, id: a }).start : null;
  const uncovered = Object.entries(meta?.channelRanges ?? {})
    .filter(([, r]) => aStart != null && r.from > aStart)
    .map(([ch]) => CHANNEL_LABELS[ch as Channel] ?? ch);

  return (
    <div className="selector">
      <div className="sel-group">
        <span className="sel-label">{t('Modality (granularity)', 'Modalidad (granularidad)')}</span>
        <div className="sel-modes">
          {GRANULARITIES.map((g: Granularity) => (
            <button
              key={g}
              className={`sel-mode ${g === granularity ? 'active' : ''}`}
              onClick={() => setGranularity(g)}
            >
              {GRANULARITY_LABELS[g][lang]}
            </button>
          ))}
        </div>
      </div>

      <div className="sel-group">
        <span className="sel-label sel-a">{t('Period A (baseline)', 'Periodo A (base)')}</span>
        <select className="sel-select" value={a} onChange={(e) => setA(e.target.value)}>
          {options.map((p) => <option key={p.id} value={p.id}>{labelOf(p, lang)}</option>)}
        </select>
      </div>

      <span className="sel-vs">{t('vs', 'vs')}</span>

      <div className="sel-group">
        <span className="sel-label sel-b">{t('Period B (focus)', 'Periodo B (foco)')}</span>
        <select className="sel-select" value={b} onChange={(e) => setB(e.target.value)}>
          {options.map((p) => <option key={p.id} value={p.id}>{labelOf(p, lang)}</option>)}
        </select>
      </div>

      {options.length === 0 && (
        <span className="sel-tag">{t('No periods with data for this modality.', 'No hay periodos con datos para esta modalidad.')}</span>
      )}

      {uncovered.length > 0 && (
        <div className="note warn" style={{ flexBasis: '100%', marginTop: 10 }}>
          {t(
            `Period A predates the history of: ${uncovered.join(', ')}. Only Instagram and Facebook go back 13 months — those sections will read 0 for A, which is missing history, not a drop.`,
            `El periodo A precede al histórico de: ${uncovered.join(', ')}. Solo Instagram y Facebook llegan 13 meses atrás — esas secciones saldrán en 0 en A, que es falta de histórico, no una caída.`,
          )}
        </div>
      )}
    </div>
  );
}
