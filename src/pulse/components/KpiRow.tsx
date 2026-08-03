import { formatValue, type KpiValue } from '@/pulse/shared';
import { useI18n } from '../lib/i18n';
import { Delta } from './Delta';

/** Fila de KPIs en modo comparación (número grande = B, comps = A + delta). */
export function KpiRow({ values, cols = 4 }: { values: KpiValue[]; cols?: number }) {
  const { tl, t } = useI18n();
  return (
    <div className={`kpi-row cols${cols}`}>
      {values.map((v) => (
        <div className="kpi" key={v.key}>
          <div className="kpi-label">
            <span>{tl(v.label)}</span>
            <span className="kpi-origin">{v.origin}</span>
          </div>
          <div className="kpi-val">{formatValue(v.b, v.format)}</div>
          <div className="kpi-comps">
            <span><Delta value={v.delta} /> {t('vs', 'vs')} A ({formatValue(v.a, v.format)})</span>
          </div>
        </div>
      ))}
    </div>
  );
}
