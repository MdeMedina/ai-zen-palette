import { formatValue } from '@/pulse/shared';
import { usePeriods } from '../state/periods';
import { api } from '../lib/api';
import { useAsync } from '../lib/hooks';
import { useI18n } from '../lib/i18n';
import { Delta } from '../components/Delta';
import { Sparkline } from '../components/Charts';
import { Collapsible } from '../components/Collapsible';

/** 0 · Banda Superior (Executive) — foto de alto nivel del portafolio (doc §3.0). */
export function Executive() {
  const { granularity, a, b } = usePeriods();
  const { t } = useI18n();
  const ready = a && b;

  const kpis = useAsync(
    () => api.kpis(granularity, a, b, ['ig_reach', 'ig_interactions', 'sessions', 'spend', 'conversions'], {}),
    [granularity, a, b],
  );
  // Total Audience = conteo ABSOLUTO actual, INDEPENDIENTE del selector A/B.
  // IG (followers_count) + YouTube (subscriber_count) directos de Windsor;
  // TikTok reconstruido (ancla + deltas) si hay ancla configurada.
  const audience = useAsync(() => api.audience(), []);
  const sessSpark = useAsync(() => api.series('sessions', 'week', {}), []);
  // Top 3 posteos con mejor engagement del periodo B, de TODAS las plataformas.
  const topEng = useAsync(() => (b ? api.topEngagement({ granularity, b, limit: 3 }) : Promise.resolve([])), [granularity, b]);

  if (!ready) return null;
  const get = (k: string) => kpis.data?.values.find((v) => v.key === k);
  const ig = audience.data?.instagram ?? 0;
  const yt = audience.data?.youtube ?? 0;
  const tk = audience.data?.tiktok ?? null; // null si no hay ancla configurada
  const li = audience.data?.linkedin ?? null; // null si no hay ancla configurada
  const total = audience.data?.total ?? 0;
  const audienceSub = ['IG', 'YT', tk != null ? 'TK' : null, li != null ? 'LI' : null].filter(Boolean).join(' + ');
  const extraTiles = (tk != null ? 1 : 0) + (li != null ? 1 : 0);

  return (
    <Collapsible num="00" title={t('Overview', 'Resumen')} meta={t('Portfolio Summary', 'Resumen del Portafolio')}>
      <div className="overview-band">
        <div className="eyebrow">{t('Overview · Portfolio Summary', 'Overview · Resumen del Portafolio')}</div>
        <div className="overview-grid">
          <Tile label={t('Total Audience', 'Audiencia Total')} value={formatValue(total, 'int')}
            sub={`IG ${formatValue(ig, 'int')} · YT ${formatValue(yt, 'int')}${tk != null ? ` · TK ${formatValue(tk, 'int')}` : ''}${li != null ? ` · LI ${formatValue(li, 'int')}` : ''}`} />
          <Tile label={t('IG Portfolio Reach', 'Alcance Portafolio IG')} value={formatValue(get('ig_reach')?.b ?? null, 'int')} delta={get('ig_reach')?.delta ?? null} />
          <Tile label={t('IG Interactions', 'Interacciones IG')} value={formatValue(get('ig_interactions')?.b ?? null, 'int')} delta={get('ig_interactions')?.delta ?? null} />
          <Tile label={t('Web Sessions', 'Sesiones Web')} value={formatValue(get('sessions')?.b ?? null, 'int')} delta={get('sessions')?.delta ?? null}
            spark={sessSpark.data ?? undefined} />
        </div>
        <div className="overview-bottom" style={{ marginTop: 1 }}>
          <Stat label={t('Ad Spend', 'Inversión Publicitaria')} value={`${formatValue(get('spend')?.b ?? null, 'money')}`} delta={get('spend')?.delta ?? null} />
          <Stat label={t('Paid Conversions', 'Conversiones Pagadas')} value={formatValue(get('conversions')?.b ?? null, 'float1')} delta={get('conversions')?.delta ?? null} />
          <Stat label={t('Comparison', 'Comparación')} value={t('Period B vs Period A', 'Periodo B vs Periodo A')} />
        </div>
      </div>

      <div className="audience-row" style={{ gridTemplateColumns: `repeat(${3 + extraTiles},1fr)` }}>
        <Aud label="Instagram" value={ig} />
        <Aud label="YouTube" value={yt} />
        {tk != null && <Aud label="TikTok" value={tk} />}
        {li != null && <Aud label="LinkedIn" value={li} />}
        <div className="aud-tile aud-total">
          <div className="aud-label">{t('Total Audience', 'Audiencia Total')}</div>
          <div className="aud-val">{formatValue(total, 'int')}</div>
          <div className="aud-sub">{audienceSub}</div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 24, padding: 0 }}>
        <div className="card-h" style={{ padding: '14px 16px 0' }}>
          <div className="card-title">{t('Top 3 posts by engagement · all platforms', 'Top 3 posteos por engagement · todas las plataformas')}</div>
          <div className="card-badge">{t('Period B', 'Periodo B')}</div>
        </div>
        <div style={{ padding: '10px 16px 14px' }}>
          {!topEng.data?.length ? (
            <div className="loading">{t('No posts with enough views in this period.', 'Sin posteos con suficientes vistas en este periodo.')}</div>
          ) : (
            topEng.data.map((p, i) => (
              <div className="ranked-post" key={`${p.platform}-${i}`}>
                <div className="ranked-post-rank">{`#${i + 1}`}</div>
                <div className="ranked-post-body">
                  <div className="ranked-post-meta">
                    <span className="ranked-post-er">{p.engRate.toFixed(1)}%</span>
                    <span className={`platform-badge pb-${p.platform}`}>{platformLabel(p.platform)}</span>
                    <span className="ranked-post-date">{p.date}</span>
                    {p.url && <a className="bw-link" href={p.url} target="_blank" rel="noreferrer">{t('View', 'Ver')}</a>}
                  </div>
                  <div className="ranked-post-caption">{p.title || '—'}</div>
                  <div className="ranked-post-stats">
                    {t('Interactions', 'Interacciones')} {Math.round(p.interactions).toLocaleString()} · {t('Views', 'Vistas')} {Math.round(p.views).toLocaleString()}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </Collapsible>
  );
}

function platformLabel(p: string): string {
  return p === 'instagram' ? 'Instagram' : p === 'youtube' ? 'YouTube' : p === 'tiktok' ? 'TikTok' : p;
}

function Tile({ label, value, delta, sub, spark }: { label: string; value: string; delta?: number | null; sub?: string; spark?: import('@/pulse/shared').SeriesResponse }) {
  return (
    <div className="ov-tile">
      <div className="ov-label">{label}</div>
      <div className="ov-val">{value}</div>
      {delta !== undefined && <div className="ov-delta"><Delta value={delta} /></div>}
      {sub && <div className="ov-delta" style={{ opacity: .4, fontSize: 9 }}>{sub}</div>}
      {spark && <div style={{ marginTop: 6 }}><Sparkline data={spark} /></div>}
    </div>
  );
}
function Stat({ label, value, delta }: { label: string; value: string; delta?: number | null }) {
  return (
    <div className="ov-stat">
      <span className="label">{label}</span>
      <span className="val">{value}{delta != null && <> · <Delta value={delta} /></>}</span>
    </div>
  );
}
function Aud({ label, value }: { label: string; value: number }) {
  return (
    <div className="aud-tile">
      <div className="aud-label">{label}</div>
      <div className="aud-val">{formatValue(value, 'int')}</div>
    </div>
  );
}
