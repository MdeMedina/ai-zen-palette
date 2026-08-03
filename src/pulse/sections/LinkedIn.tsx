import { usePeriods } from '../state/periods';
import { api } from '../lib/api';
import { useAsync } from '../lib/hooks';
import { useI18n } from '../lib/i18n';
import { Collapsible } from '../components/Collapsible';
import { AiInsights } from '../components/AiInsights';
import { KpiRow } from '../components/KpiRow';
import { HistoryChart } from '../components/Charts';

/** 6 · LinkedIn — 2 páginas (PKGD Group + G4) (doc §3.6). */
export function LinkedIn() {
  const { granularity, a, b } = usePeriods();
  const { t } = useI18n();
  const keys = ['li_impressions', 'li_unique_impressions', 'li_likes', 'li_comments', 'li_engagement_rate', 'li_posts', 'li_followers'];
  const pkgd = useAsync(() => (a && b ? api.kpis(granularity, a, b, keys, { brand: 'pkgd' }) : Promise.resolve(null)), [granularity, a, b]);
  const g4 = useAsync(() => (a && b ? api.kpis(granularity, a, b, keys, { brand: 'g4' }) : Promise.resolve(null)), [granularity, a, b]);
  const history = useAsync(() => api.series('li_impressions', 'week', { brand: 'g4' }), []);
  if (!a || !b) return null;
  // Solo mostramos KPIs que traen datos (a o b no nulos). LinkedIn Organic de la
  // cuenta hoy solo entrega Posts; Impressions/Followers quedan ocultos hasta que
  // Windsor los exponga, en vez de mostrar celdas vacías.
  const withData = (r: typeof pkgd) => (r.data?.values ?? []).filter((v) => v.a != null || v.b != null);
  const card = (title: string, r: typeof pkgd) => {
    const vals = withData(r);
    return (
      <div className="card">
        <div className="card-h"><div className="card-title">{title}</div></div>
        {r.data && (vals.length
          ? <KpiRow values={vals} cols={Math.min(vals.length, 3)} />
          : <div className="loading">{t('No data from LinkedIn connector yet.', 'Sin datos del conector de LinkedIn aún.')}</div>)}
      </div>
    );
  };
  return (
    <Collapsible num="06" title="LinkedIn" meta={t('2 pages', '2 páginas')}>
      <div className="g2">
        {card('PKGD Group', pkgd)}
        {card('G4 Tequila', g4)}
      </div>
      <div className="card" style={{ marginTop: 16 }}>
        <div className="card-h"><div className="card-title">{t('Impressions · history (G4)', 'Impresiones · histórico (G4)')}</div></div>
        {history.data && <HistoryChart data={history.data} format="int" />}
      </div>
      <div className="g2" style={{ marginTop: 16 }}>
        <div>
          <h4 className="card-title" style={{ marginBottom: 8 }}>PKGD Group</h4>
          <AiInsights network="linkedin" brand="pkgd" />
        </div>
        <div>
          <h4 className="card-title" style={{ marginBottom: 8 }}>G4 Tequila</h4>
          <AiInsights network="linkedin" brand="g4" />
        </div>
      </div>
    </Collapsible>
  );
}
