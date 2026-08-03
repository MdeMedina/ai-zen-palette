import { useState } from 'react';
import { formatValue } from '@/pulse/shared';
import { usePeriods } from '../state/periods';
import { api } from '../lib/api';
import { useAsync } from '../lib/hooks';
import { useI18n } from '../lib/i18n';
import { Collapsible } from '../components/Collapsible';
import { AiInsights } from '../components/AiInsights';
import { KpiRow } from '../components/KpiRow';
import { HistoryChart } from '../components/Charts';

/** 5 · TikTok — PKGD Group + G4 Tequila (doc §3.5). */
export function TikTok() {
  const { granularity, a, b } = usePeriods();
  const { t } = useI18n();
  const [brand, setBrand] = useState('g4');
  // Windsor entrega para TikTok: video_views, likes y net-followers (delta diario).
  // NO entrega followers absolutos ni avg watch time, así que no se piden.
  const kpis = useAsync(() => (a && b ? api.kpis(granularity, a, b, ['tt_views', 'tt_likes', 'tt_net_followers', 'tt_posts'], { brand }) : Promise.resolve(null)), [granularity, a, b, brand]);
  // Historia siempre semanal (resolución estable, independiente de la modalidad A/B).
  const history = useAsync(() => api.series('tt_views', 'week', { brand }), [brand]);
  // Top 3 publicaciones históricas por rendimiento (vistas).
  const topVideos = useAsync(() => api.tiktokTopVideos(brand, 3), [brand]);
  if (!a || !b) return null;
  return (
    <Collapsible num="05" title="TikTok" meta={t('2 channels', '2 canales')}>
      <div className="tab-bar">
        {[['g4', 'G4 Tequila'], ['pkgd', 'PKGD Group']].map(([id, label]) => (
          <button key={id} className={`tab ${id === brand ? 'active' : ''}`} onClick={() => setBrand(id)}>{label}</button>
        ))}
      </div>
      {kpis.data && <KpiRow values={kpis.data.values} cols={4} />}
      <div className="card">
        <div className="card-h"><div className="card-title">{t('Video Views · history', 'Vistas de Video · histórico')}</div></div>
        {history.data && <HistoryChart data={history.data} format="int" />}
      </div>
      <div className="card" style={{ marginTop: 16, padding: 0 }}>
        <div className="card-h" style={{ padding: '14px 16px 0' }}>
          <div className="card-title">{t('Top 3 posts by performance', 'Top 3 publicaciones por rendimiento')}</div>
          <div className="card-badge">{t('All-time', 'Histórico')}</div>
        </div>
        <div style={{ padding: '8px 4px 4px' }}>
          {!topVideos.data?.length ? (
            <div className="loading">{t('Per-video metrics not available yet (TikTok rate-limits video insights). They fill in on the next syncs.', 'Métricas por video aún no disponibles (TikTok limita las insights por video). Se completan en los próximos syncs.')}</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>{t('Video', 'Video')}</th>
                  <th>{t('Published', 'Publicado')}</th>
                  <th className="r">{t('Views', 'Vistas')}</th>
                  <th className="r">{t('Likes', 'Likes')}</th>
                  <th className="r">{t('Shares', 'Compartidos')}</th>
                </tr>
              </thead>
              <tbody>
                {topVideos.data.map((v) => (
                  <tr key={v.videoId}>
                    <td style={{ maxWidth: 320, whiteSpace: 'normal' }}>{v.url ? <a className="bw-link" href={v.url} target="_blank" rel="noreferrer">{v.title || v.videoId}</a> : (v.title || v.videoId)}</td>
                    <td>{v.publishedAt || '—'}</td>
                    <td className="r">{formatValue(v.views, 'int')}</td>
                    <td className="r">{formatValue(v.likes, 'int')}</td>
                    <td className="r">{formatValue(v.shares, 'int')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
      <div className="note info">{t('TikTok reports views, likes and net follower growth. Per-video metrics are intermittent from the connector and fill in as data becomes available.', 'TikTok reporta vistas, likes y crecimiento neto de seguidores. Las métricas por video son intermitentes en el conector y se completan a medida que hay datos.')}</div>
      <AiInsights network="tiktok" brand={brand} />
    </Collapsible>
  );
}
