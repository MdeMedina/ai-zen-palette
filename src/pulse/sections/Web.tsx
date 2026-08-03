import { usePeriods } from '../state/periods';
import { api } from '../lib/api';
import { useAsync } from '../lib/hooks';
import { useI18n } from '../lib/i18n';
import { AiNote } from '../components/Section';
import { Collapsible } from '../components/Collapsible';
import { KpiRow } from '../components/KpiRow';
import { OverlayChart, StackedCompare, RankBars } from '../components/Charts';

/** 1 · Web / GA4 (doc §3.1). */
export function Web() {
  const { granularity, a, b } = usePeriods();
  const { t } = useI18n();
  const keys = ['sessions', 'active_users', 'new_users', 'engaged_sessions', 'page_views', 'engagement_rate'];
  const kpis = useAsync(() => api.kpis(granularity, a, b, keys, {}), [granularity, a, b]);
  const overlay = useAsync(() => api.overlay('sessions', granularity, a, b), [granularity, a, b]);
  const breakdown = useAsync(() => api.breakdown('sessions', granularity, a, b), [granularity, a, b]);

  if (!a || !b) return null;
  const items = breakdown.data?.items ?? [];
  // Traffic by Channel = dimensiones que NO son rutas (canales GA4), sin "(not set)".
  const trafficItems = items.filter((i) => !i.key.startsWith('/') && i.key !== '(not set)').slice(0, 8);
  // Landing Pages = dimensiones que son rutas ('/...'), top 8.
  const landingItems = items.filter((i) => i.key.startsWith('/')).slice(0, 8);

  return (
    <Collapsible num="01" title={t('Web Traffic', 'Tráfico Web')} meta="GA4 · pkgdgroup.com">
      {kpis.data && <KpiRow values={kpis.data.values} cols={3} />}
      <div className="g2">
        <div className="card">
          <div className="card-h"><div className="card-title">{t('Sessions · A vs B overlay', 'Sesiones · overlay A vs B')}</div></div>
          {overlay.data && <OverlayChart data={overlay.data} format="int" aPeriod={overlay.data.a.period} bPeriod={overlay.data.b.period} />}
        </div>
        <div className="card">
          <div className="card-h"><div className="card-title">{t('Traffic by Channel', 'Tráfico por Canal')}</div><div className="card-badge">A / B</div></div>
          {trafficItems.length > 0 && <StackedCompare items={trafficItems} format="int" />}
        </div>
      </div>
      <div className="card" style={{ marginTop: 16 }}>
        <div className="card-h"><div className="card-title">{t('Landing Pages by Brand', 'Landing Pages por Marca')}</div><div className="card-badge">Period B</div></div>
        <RankBars items={landingItems.map((i) => ({ label: i.label, value: i.b ?? i.a }))} format="int" />
      </div>
      <AiNote section="ga4" />
    </Collapsible>
  );
}
