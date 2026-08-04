import { useState } from 'react';
import { IG_BRANDS, BRAND_LABELS, rangeOf } from '@/pulse/shared';
import { usePeriods } from '../state/periods';
import { api } from '../lib/api';
import { useAsync } from '../lib/hooks';
import { useI18n } from '../lib/i18n';
import { Collapsible } from '../components/Collapsible';
import { AiInsights } from '../components/AiInsights';
import { KpiRow } from '../components/KpiRow';
import { HistoryChart, StackedCompare, ProgressiveChart } from '../components/Charts';
import { lastMonthsRange, PROGRESSIVE_MONTHS } from '../lib/progressive';

/** Etiqueta legible del tipo de publicación de Instagram. */
function postTypeLabel(mediaType: string, productType: string, es: boolean): string {
  if (productType === 'REELS' || mediaType === 'REELS') return 'Reel';
  if (productType === 'STORY') return es ? 'Historia' : 'Story';
  if (mediaType === 'CAROUSEL_ALBUM') return es ? 'Carrusel' : 'Carousel';
  if (mediaType === 'VIDEO') return es ? 'Video' : 'Video';
  if (mediaType === 'IMAGE') return es ? 'Imagen' : 'Image';
  return productType || mediaType || '—';
}

/** Tarjeta de un post rankeado por engagement rate. */
function RankedPostRow({ p, rank, es }: { p: import('../lib/api').RankedPost; rank: string; es: boolean }) {
  return (
    <div className="ranked-post">
      <div className="ranked-post-rank">{rank}</div>
      <div className="ranked-post-body">
        <div className="ranked-post-meta">
          <span className="ranked-post-er">{Math.round(p.views).toLocaleString()}</span>
          <span className="ranked-post-views-label">views</span>
          <span className="ranked-post-type">{postTypeLabel(p.mediaType, p.productType, es)}</span>
          <span className="ranked-post-date">{p.date}</span>
          {p.url && <a className="bw-link" href={p.url} target="_blank" rel="noreferrer">{es ? 'Ver' : 'View'}</a>}
        </div>
        <div className="ranked-post-caption">{p.caption || '—'}</div>
        <div className="ranked-post-stats">
          {es ? 'Interacciones' : 'Engagement'} {Math.round(p.engagement).toLocaleString()}
          {p.engRate != null && <> ({p.engRate.toFixed(1)}%)</>} · {es ? 'Alcance' : 'Reach'} {Math.round(p.reach).toLocaleString()} · ♥ {Math.round(p.likes).toLocaleString()} · 💬 {Math.round(p.comments).toLocaleString()} · 🔖 {Math.round(p.saved).toLocaleString()}
        </div>
      </div>
    </div>
  );
}

/** 3 · Instagram · Por Marca (doc §3.3). */
export function Instagram() {
  const { granularity, a, b, options } = usePeriods();
  const { t, lang } = useI18n();
  const [brand, setBrand] = useState<string>(IG_BRANDS[0]);
  const bSpec = options.find((p) => p.id === b);
  const bRange = bSpec ? rangeOf(bSpec) : null;

  const portfolio = useAsync(
    () => (a && b ? api.kpis(granularity, a, b, ['ig_reach', 'ig_views', 'ig_interactions', 'ig_shares'], {}) : Promise.resolve(null)),
    [granularity, a, b],
  );
  // ig_followers = total ABSOLUTO de seguidores de la marca (snapshot al cierre
  // del periodo); ig_net_followers = lo que creció/decreció dentro del periodo.
  const brandKpis = useAsync(
    () => (a && b ? api.kpis(granularity, a, b, ['ig_followers', 'ig_reach', 'ig_interactions', 'ig_eng_rate', 'ig_net_followers', 'ig_posts'], { brand }) : Promise.resolve(null)),
    [granularity, a, b, brand],
  );
  const breakdown = useAsync(
    () => (a && b ? api.kpis(granularity, a, b, ['ig_likes', 'ig_comments', 'ig_saves', 'ig_shares'], { brand }) : Promise.resolve(null)),
    [granularity, a, b, brand],
  );
  // Historial de interacciones acotado al periodo B (grano diario dentro del rango).
  const history = useAsync(
    () => (bRange ? api.series('ig_interactions', 'day', { brand, from: bRange.start, to: bRange.end }) : Promise.resolve(null)),
    [brand, bRange?.start, bRange?.end],
  );
  // Gráfico progresivo del año: Alcance vs Vistas por mes, ajeno al selector A/B.
  const progressive = useAsync(() => {
    const { from, to } = lastMonthsRange();
    return api.multiSeries(['ig_reach', 'ig_views'], 'month', { brand, lang, from, to });
  }, [brand, lang]);
  const topPost = useAsync(() => api.topPosts(brand, 1), [brand]);
  // Ranking por vistas del periodo: top 3 + la menos vista.
  const ranking = useAsync(
    () => (b ? api.postsRanking({ brand, granularity, b, top: 3 }) : Promise.resolve(null)),
    [brand, granularity, b],
  );
  // Historias (Stories) del periodo: views y reach por story.
  const stories = useAsync(
    () => (b ? api.stories({ brand, granularity, b }) : Promise.resolve(null)),
    [brand, granularity, b],
  );

  if (!a || !b) return null;
  const bd = breakdown.data?.values.map((v) => ({ key: v.key, label: v.label.en, a: v.a, b: v.b })) ?? [];

  return (
    <Collapsible num="03" title={t('Instagram · By Brand', 'Instagram · Por Marca')} meta={t('~10–11 brands', '~10–11 marcas')}>
      {portfolio.data && <KpiRow values={portfolio.data.values} cols={4} />}

      <div className="tab-bar">
        {IG_BRANDS.map((br) => (
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

      <div className="g2">
        <div className="card">
          <div className="card-h"><div className="card-title">{t('Engagement Breakdown', 'Desglose de Engagement')}</div><div className="card-badge">A / B</div></div>
          {bd.length > 0 && <StackedCompare items={bd} format="int" />}
        </div>
        <div className="card">
          <div className="card-h"><div className="card-title">{t('Interactions · current period', 'Interacciones · periodo actual')}</div><div className="card-badge">B</div></div>
          {history.data && <HistoryChart data={history.data} format="int" />}
        </div>
      </div>

      <div className="card" style={{ marginTop: 16, padding: 0 }}>
        <div className="card-h" style={{ padding: '14px 16px 0' }}>
          <div className="card-title">{t('Top posts by views', 'Top publicaciones por vistas')}</div>
          <div className="card-badge">{t('Period B', 'Periodo B')}</div>
        </div>
        <div style={{ padding: '10px 16px 14px' }}>
          {!ranking.data || ranking.data.total === 0 ? (
            <div className="loading">{t('No posts with views in this period.', 'Sin publicaciones con vistas en este periodo.')}</div>
          ) : (
            <>
              {ranking.data.best.map((p, i) => (
                <RankedPostRow key={p.postId} p={p} rank={`#${i + 1}`} es={lang === 'es'} />
              ))}
              {ranking.data.worst && (
                <>
                  <div className="ranked-divider">{t('Fewest views', 'Menos vistas')}</div>
                  <RankedPostRow p={ranking.data.worst} rank="↓" es={lang === 'es'} />
                </>
              )}
            </>
          )}
        </div>
      </div>

      <div className="card" style={{ marginTop: 16, padding: 0 }}>
        <div className="card-h" style={{ padding: '14px 16px 0' }}>
          <div className="card-title">{t('Instagram Stories', 'Historias de Instagram')}</div>
          <div className="card-badge">{t('Period B', 'Periodo B')}</div>
        </div>
        <div style={{ padding: '10px 16px 14px' }}>
          {!stories.data?.count ? (
            <div className="loading">{t('No stories captured in this period.', 'Sin historias capturadas en este periodo.')}</div>
          ) : (
            <>
              <div className="story-totals">
                <div className="story-total"><span className="story-total-val">{Math.round(stories.data.totals.views).toLocaleString()}</span><span className="story-total-lbl">{t('Views', 'Vistas')}</span></div>
                <div className="story-total"><span className="story-total-val">{Math.round(stories.data.totals.reach).toLocaleString()}</span><span className="story-total-lbl">{t('Reach', 'Alcance')}</span></div>
                <div className="story-total"><span className="story-total-val">{stories.data.count}</span><span className="story-total-lbl">{t('Stories', 'Historias')}</span></div>
              </div>
              <table>
                <thead>
                  <tr>
                    <th>{t('Date', 'Fecha')}</th>
                    <th className="r">{t('Views', 'Vistas')}</th>
                    <th className="r">{t('Reach', 'Alcance')}</th>
                    <th className="r">{t('Replies', 'Respuestas')}</th>
                    <th className="r">{t('Link', 'Enlace')}</th>
                  </tr>
                </thead>
                <tbody>
                  {stories.data.stories.map((s) => (
                    <tr key={s.storyId}>
                      <td>{s.date}</td>
                      <td className="r">{Math.round(s.views).toLocaleString()}</td>
                      <td className="r">{Math.round(s.reach).toLocaleString()}</td>
                      <td className="r">{Math.round(s.replies).toLocaleString()}</td>
                      <td className="r">{s.url ? <a className="bw-link" href={s.url} target="_blank" rel="noreferrer">{t('View', 'Ver')}</a> : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="note warn" style={{ marginTop: 10 }}>{t('Stories are ephemeral: Windsor only returns recent ones, so history builds up with each sync.', 'Las historias son efímeras: Windsor solo devuelve las recientes, así que el histórico se acumula con cada sync.')}</div>
            </>
          )}
        </div>
      </div>

      {topPost.data?.[0] && (
        <div className="note info">
          <strong>{t('Top Post', 'Mejor Post')} · {BRAND_LABELS[brand]}:</strong> {topPost.data[0].caption} — {topPost.data[0].engagement} eng. / {topPost.data[0].views} views ·{' '}
          <a className="bw-link" href={topPost.data[0].permalink}>{topPost.data[0].postType}</a>
        </div>
      )}
      <div className="note info">{t(
        `Windsor does serve daily Instagram history: reach, views and interactions are backfilled ${PROGRESSIVE_MONTHS} months (see the progression chart). Followers are the exception — the connector only returns the current count, so that series starts on the first sync.`,
        `Windsor sí entrega histórico diario de Instagram: alcance, vistas e interacciones están rellenados ${PROGRESSIVE_MONTHS} meses atrás (ver el gráfico de progresión). La excepción son los seguidores — el conector solo devuelve el conteo actual, así que esa serie arranca en el primer sync.`,
      )}</div>
      <AiInsights network="instagram" brand={brand} />
    </Collapsible>
  );
}
