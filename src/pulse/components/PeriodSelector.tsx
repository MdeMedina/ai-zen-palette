import { GRANULARITIES, GRANULARITY_LABELS, labelOf, type Granularity } from '@/pulse/shared';
import { usePeriods } from '../state/periods';
import { useI18n } from '../lib/i18n';

/** Selector A/B de dos pasos (doc §1): modalidad + dos periodos concretos. */
export function PeriodSelector() {
  const { granularity, setGranularity, a, b, setA, setB, options } = usePeriods();
  const { lang, t } = useI18n();

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
    </div>
  );
}
