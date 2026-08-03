import { usePeriods } from '../state/periods';
import { api } from '../lib/api';
import { useAsync } from '../lib/hooks';
import { useI18n } from '../lib/i18n';
import { AiNote } from '../components/Section';
import { Collapsible } from '../components/Collapsible';
import { KpiRow } from '../components/KpiRow';
import { OverlayChart } from '../components/Charts';

/** 2 · Paid Media · Google Ads (módulo activable) (doc §3.2). */
export function Paid({ enabled }: { enabled: boolean }) {
  const { granularity, a, b } = usePeriods();
  const { t } = useI18n();
  const keys = ['spend', 'impressions', 'clicks', 'conversions', 'ctr', 'cpc', 'cpa', 'conv_rate'];
  const kpis = useAsync(() => (enabled && a && b ? api.kpis(granularity, a, b, keys, {}) : Promise.resolve(null)), [granularity, a, b, enabled]);
  const overlay = useAsync(() => (enabled && a && b ? api.overlay('spend', granularity, a, b) : Promise.resolve(null)), [granularity, a, b, enabled]);

  if (!enabled) return null;
  if (!a || !b) return null;

  return (
    <Collapsible num="02" title={t('Paid Media · Google Ads', 'Medios Pagados · Google Ads')} meta={t('Toggleable module', 'Módulo activable')}>
      {kpis.data && <KpiRow values={kpis.data.values} cols={4} />}
      <div className="card">
        <div className="card-h"><div className="card-title">{t('Spend · A vs B overlay', 'Inversión · overlay A vs B')}</div></div>
        {overlay.data && <OverlayChart data={overlay.data} format="money" aPeriod={overlay.data.a.period} bPeriod={overlay.data.b.period} />}
      </div>
      <AiNote section="google_ads" />
    </Collapsible>
  );
}
