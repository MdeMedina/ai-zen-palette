import { useState } from 'react';
import { BRAND_LABELS } from '@/pulse/shared';
import { usePeriods } from '../state/periods';
import { api } from '../lib/api';
import { useAsync } from '../lib/hooks';
import { useI18n } from '../lib/i18n';
import { AiNote } from '../components/Section';
import { Collapsible } from '../components/Collapsible';
import { KpiRow } from '../components/KpiRow';
import { OverlayChart } from '../components/Charts';

/** Marcas con inversión en Meta Ads (cuentas conectadas en Windsor). */
const META_BRANDS = ['pkgd', 'g4'];

/** 2b · Paid Media · Meta Ads (módulo activable). */
export function MetaAds({ enabled }: { enabled: boolean }) {
  const { granularity, a, b } = usePeriods();
  const { t } = useI18n();
  const [brand, setBrand] = useState('pkgd');
  const keys = ['meta_spend', 'meta_impressions', 'meta_clicks', 'meta_reach', 'meta_link_clicks', 'meta_ctr', 'meta_cpc', 'meta_cplc'];
  const kpis = useAsync(() => (enabled && a && b ? api.kpis(granularity, a, b, keys, { brand }) : Promise.resolve(null)), [granularity, a, b, enabled, brand]);
  const overlay = useAsync(() => (enabled && a && b ? api.overlay('meta_spend', granularity, a, b, brand) : Promise.resolve(null)), [granularity, a, b, enabled, brand]);

  if (!enabled) return null;
  if (!a || !b) return null;

  return (
    <Collapsible num="02b" title={t('Paid Media · Meta Ads', 'Medios Pagados · Meta Ads')} meta={t('Toggleable module', 'Módulo activable')}>
      <div className="tab-bar">
        {META_BRANDS.map((br) => (
          <button key={br} className={`tab ${br === brand ? 'active' : ''}`} onClick={() => setBrand(br)}>{BRAND_LABELS[br]}</button>
        ))}
      </div>
      {kpis.data && <KpiRow values={kpis.data.values} cols={4} />}
      <div className="card">
        <div className="card-h"><div className="card-title">{t('Spend · A vs B overlay', 'Inversión · overlay A vs B')}</div></div>
        {overlay.data && <OverlayChart data={overlay.data} format="money" aPeriod={overlay.data.a.period} bPeriod={overlay.data.b.period} />}
      </div>
      <AiNote section="meta_ads" />
    </Collapsible>
  );
}
