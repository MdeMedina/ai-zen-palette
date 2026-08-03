import { useEffect, useRef, useState } from 'react';
import { usePeriods } from '../state/periods';
import { api } from '../lib/api';
import { useAsync } from '../lib/hooks';
import { useI18n } from '../lib/i18n';

/**
 * Highlights & Next Steps [IA] por red social y marca, específicos de la
 * comparación A→B seleccionada. Lee `${network}_highlights` / `_next_steps`
 * para (a, b, brand, lang). Si no hay nota cacheada para esa comparación,
 * la genera on-demand (`ensureNote`) y la muestra al terminar.
 */
export function AiInsights({ network, brand }: { network: string; brand?: string }) {
  const { a, b, granularity } = usePeriods();
  const { lang, t } = useI18n();
  const [tick, setTick] = useState(0);
  const [generating, setGenerating] = useState(false);
  const attempted = useRef<Set<string>>(new Set());

  const hl = useAsync(() => api.notes(`${network}_highlights`, a, b, lang, brand), [network, brand, a, b, lang, granularity, tick]);
  const ns = useAsync(() => api.notes(`${network}_next_steps`, a, b, lang, brand), [network, brand, a, b, lang, granularity, tick]);

  const worked = hl.data?.[0]?.body;
  const invest = ns.data?.[0]?.body;
  const settled = !hl.loading && !ns.loading;
  const key = a && b ? `${network}|${brand ?? ''}|${granularity}|${a}|${b}` : '';
  const attemptedThis = !!key && attempted.current.has(key);

  // Si la comparación no tiene nota cacheada, generarla una sola vez por (a,b,red,marca).
  useEffect(() => {
    if (!key || !settled || worked || invest || generating || attemptedThis) return;
    attempted.current.add(key);
    setGenerating(true);
    api
      .ensureNote({ section: network, granularity, a, b, brand, langs: ['en', 'es'] })
      .then(() => setTick((x) => x + 1))
      .catch(() => {})
      .finally(() => setGenerating(false));
  }, [key, settled, worked, invest, generating, attemptedThis, network, brand, granularity, a, b]);

  // Loader mientras se genera (o justo antes de disparar la generación).
  const pending = generating || (settled && !worked && !invest && !!key && !attemptedThis);
  if (pending) {
    return (
      <div className="hl-grid" style={{ marginTop: 16 }}>
        <div className="hl-box hl-loading">{t('Generating analysis…', 'Generando análisis…')}</div>
      </div>
    );
  }
  if (!worked && !invest) return null;

  return (
    <div className="hl-grid" style={{ marginTop: 16 }}>
      {worked && (
        <div className="hl-box">
          <h4>{t('What worked', 'Qué funcionó')}</h4>
          <p>{worked}</p>
        </div>
      )}
      {invest && (
        <div className="hl-box">
          <h4>{t('Where to invest next', 'Dónde invertir')}</h4>
          <p>{invest}</p>
        </div>
      )}
    </div>
  );
}
