import { useState } from 'react';
import { FB_BRANDS, BRAND_LABELS, rangeOf } from '@/pulse/shared';
import { usePeriods } from '../state/periods';
import { api } from '../lib/api';
import { useAsync } from '../lib/hooks';
import { useI18n } from '../lib/i18n';
import { Collapsible } from '../components/Collapsible';
import { AiInsights } from '../components/AiInsights';
import { KpiRow } from '../components/KpiRow';
import { HistoryChart, ProgressiveChart } from '../components/Charts';
import { lastMonthsRange, PROGRESSIVE_MONTHS } from '../lib/progressive';

/**
 * Etiqueta legible del tipo de publicación de Facebook. Windsor devuelve el
 * `media_type` crudo de la Graph API ('video_inline', 'album', 'photo'…).
 */
function postTypeLabel(mediaType: string, es: boolean): string {
  switch (mediaType) {
    case 'video_inline':
    case 'video':
      return 'Video';
    case 'album':
      return es ? 'Álbum' : 'Album';
    case 'photo':
      return es ? 'Foto' : 'Photo';
    case 'link':
      return es ? 'Enlace' : 'Link';
    case 'status':
      return es ? 'Texto' : 'Status';
    default:
      return mediaType || '—';
  }
}

/** Tarjeta de una publicación rankeada por vistas (impresiones). */
function RankedPostRow({ p, rank, es }: { p: import('../lib/api').RankedPost; rank: string; es: boolean }) {
  return (
    <div className="ranked-post">
      <div className="ranked-post-rank">{rank}</div>
      <div className="ranked-post-body">
        <div className="ranked-post-meta">
          <span className="ranked-post-er">{Math.round(p.views).toLocaleString()}</span>
          <span className="ranked-post-views-label">{es ? 'impresiones' : 'impressions'}</span>
          <span className="ranked-post-type">{postTypeLabel(p.mediaType, es)}</span>
          <span className="ranked-post-date">{p.date}</span>
          {p.url && <a className="bw-link" href={p.url} target="_blank" rel="noreferrer">{es ? 'Ver' : 'View'}</a>}
        </div>
        <div className="ranked-post-caption">{p.caption || '—'}</div>
        <div className="ranked-post-stats">
          {es ? 'Interacciones' : 'Engagement'} {Math.round(p.engagement).toLocaleString()}
          {p.engRate != null && <> ({p.engRate.toFixed(1)}%)</>} · {es ? 'Alcance' : 'Reach'} {Math.round(p.reach).toLocaleString()} · {es ? 'Reacciones' : 'Reactions'} {Math.round(p.likes).toLocaleString()} · 💬 {Math.round(p.comments).toLocaleString()}
        </div>
      </div>
    </div>
  );
}

/**
 * 3B · Facebook · Por Marca — espejo de la sección de Instagram sobre el
 * conector `facebook_organic` (páginas orgánicas, NO Meta Ads).
 */
export function Facebook() {
  const { granularity, a, b, options } = usePeriods();
  const { t, lang } = useI18n();
  const [brand, setBrand] = useState<string>(FB_BRANDS[0]);
  const bSpec = options.find((p) => p.id === b);
  const bRange = bSpec ? rangeOf(bSpec) : null;

  const portfolio = useAsync(
    () => (a && b ? api.kpis(granularity, a, b, ['fb_reach', 'fb_views', 'fb_interactions', 'fb_video_views'], {}) : Promise.resolve(null)),
    [granularity, a, b],
  );
  // fb_followers = total absoluto de la página; fb_net_followers = neto del periodo.
  const brandKpis = useAsync(
    () => (a && b ? api.kpis(granularity, a, b, ['fb_followers', 'fb_reach', 'fb_interactions', 'fb_eng_rate', 'fb_net_followers', 'fb_posts'], { brand }) : Promise.resolve(null)),
    [granularity, a, b, brand],
  );
  // Progresión anual: Alcance vs Vistas por mes, ajena al selector A/B.
  const progressive = useAsync(() => {
    const { from, to } = lastMonthsRange();
    return api.multiSeries(['fb_reach', 'fb_views'], 'month', { brand, lang, from, to });
  }, [brand, lang]);
  // Historial de interacciones acotado al periodo B (grano diario).
  const history = useAsync(
    () => (bRange ? api.series('fb_interactions', 'day', { brand, from: bRange.start, to: bRange.end }) : Promise.resolve(null)),
    [brand, bRange?.start, bRange?.end],
  );
  // Ranking de publicaciones del periodo: top 3 + la menos vista.
  const ranking = useAsync(
    () => (b ? api.postsRanking({ brand, granularity, b, top: 3, channel: 'facebook' }) : Promise.resolve(null)),
    [brand, granularity, b],
  );

  if (!a || !b) return null;

  return (
    <Collapsible num="3B" title={t('Facebook · By Brand', 'Facebook · Por Marca')} meta={t('~10 pages', '~10 páginas')}>
      {portfolio.data && <KpiRow values={portfolio.data.values} cols={4} />}

      <div className="tab-bar">
        {FB_BRANDS.map((br) => (
          <button key={br} className={`tab ${br === brand ? 'active' : ''}`} onClick={() => setBrand(br)}>
            {BRAND_LABELS[br]}
          </button>
        ))}
      </div>

      {brandKpis.data && <KpiRow values={brandKpis.data.values} cols={6} />}

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-h">
          <div className="card-title">{t('Reach vs Views · monthly progression', 'Alcance vs Vistas · progresión mensual')}</div>
          <div className="card-badge">{t(`Last ${PROGRESSIVE_MONTHS} months`, `Últimos ${PROGRESSIVE_MONTHS} meses`)}</div>
        </div>
        {progressive.data && <ProgressiveChart data={progressive.data} />}
      </div>

      <div className="card">
        <div className="card-h">
          <div className="card-title">{t('Interactions · current period', 'Interacciones · periodo actual')}</div>
          <div className="card-badge">B</div>
        </div>
        {history.data && <HistoryChart data={history.data} format="int" />}
      </div>

      <div className="card" style={{ marginTop: 16, padding: 0 }}>
        <div className="card-h" style={{ padding: '14px 16px 0' }}>
          <div className="card-title">{t('Top posts by impressions', 'Top publicaciones por impresiones')}</div>
          <div className="card-badge">{t('Period B', 'Periodo B')}</div>
        </div>
        <div style={{ padding: '10px 16px 14px' }}>
          {!ranking.data || ranking.data.total === 0 ? (
            <div className="loading">{t('No posts with impressions in this period.', 'Sin publicaciones con impresiones en este periodo.')}</div>
          ) : (
            <>
              {ranking.data.best.map((p, i) => (
                <RankedPostRow key={p.postId} p={p} rank={`#${i + 1}`} es={lang === 'es'} />
              ))}
              {ranking.data.worst && (
                <>
                  <div className="ranked-divider">{t('Fewest impressions', 'Menos impresiones')}</div>
                  <RankedPostRow p={ranking.data.worst} rank="↓" es={lang === 'es'} />
                </>
              )}
            </>
          )}
        </div>
      </div>

      <div className="note info">
        {t(
          'Facebook has no unified "Views" metric like Instagram: "Views" here is page impressions (content shown) and "Reach" is unique people. Both include PAID reach, same as Instagram — a spike usually tracks Meta Ads spend for that period, not organic growth. Reels are reported in a separate connector table and show 0 impressions until Windsor exposes them.',
          'Facebook no tiene una métrica "Vistas" unificada como Instagram: aquí "Vistas" son impresiones de la página (contenido mostrado) y "Alcance" son personas únicas. Ambas incluyen alcance PAGADO, igual que en Instagram — un pico normalmente sigue a la inversión en Meta Ads de ese periodo, no a crecimiento orgánico. Los Reels vienen en otra tabla del conector y aparecen con 0 impresiones hasta que Windsor los exponga.',
        )}
      </div>
      <AiInsights network="facebook" brand={brand} />
    </Collapsible>
  );
}
