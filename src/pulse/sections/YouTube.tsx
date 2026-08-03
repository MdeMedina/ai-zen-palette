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

type Video = { videoId: string; title: string; url: string; publishedAt?: string; views: number; minutesWatched: number; likes: number; comments: number };

/** Tabla de videos (título + views/min/likes), título enlaza al video. */
function VideoTable({ videos, empty, showPublished }: { videos: Video[]; empty: string; showPublished?: boolean }) {
  const { t } = useI18n();
  if (!videos.length) return <div className="loading">{empty}</div>;
  return (
    <table>
      <thead>
        <tr>
          <th>{t('Video', 'Video')}</th>
          {showPublished && <th>{t('Published', 'Publicado')}</th>}
          <th className="r">{t('Views', 'Vistas')}</th>
          <th className="r">{t('Min.', 'Min.')}</th>
          <th className="r">{t('Likes', 'Likes')}</th>
        </tr>
      </thead>
      <tbody>
        {videos.map((v) => (
          <tr key={v.videoId}>
            <td><a className="bw-link" href={v.url} target="_blank" rel="noreferrer">{v.title}</a></td>
            {showPublished && <td>{v.publishedAt || '—'}</td>}
            <td className="r">{formatValue(v.views, 'int')}</td>
            <td className="r">{formatValue(v.minutesWatched, 'int')}</td>
            <td className="r">{formatValue(v.likes, 'int')}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** 4 · YouTube — PKGD Group + G4 Tequila (doc §3.4). */
export function YouTube() {
  const { granularity, a, b } = usePeriods();
  const { t } = useI18n();
  const [brand, setBrand] = useState('pkgd');
  // Windsor entrega views, minutos, likes y crecimiento neto de suscriptores
  // (delta diario) — no el total absoluto de suscriptores.
  const kpis = useAsync(() => (a && b ? api.kpis(granularity, a, b, ['yt_views', 'yt_minutes_watched', 'yt_likes', 'yt_net_subscribers'], { brand }) : Promise.resolve(null)), [granularity, a, b, brand]);
  const history = useAsync(() => api.series('yt_views', 'week', { brand }), [brand]);
  // Ranking de vistas de videos PUBLICADOS en el periodo B; y top 5 histórico.
  const publishedVideos = useAsync(() => (b ? api.videosPublished({ brand, granularity, b, limit: 20 }) : Promise.resolve([])), [brand, granularity, b]);
  const topVideos = useAsync(() => api.videos({ brand, limit: 5 }), [brand]);
  if (!a || !b) return null;
  return (
    <Collapsible num="04" title="YouTube" meta={t('2 channels · no daily grain (latency)', '2 canales · sin grano diario (latencia)')}>
      <div className="tab-bar">
        {[['pkgd', 'PKGD Group'], ['g4', 'G4 Tequila']].map(([id, label]) => (
          <button key={id} className={`tab ${id === brand ? 'active' : ''}`} onClick={() => setBrand(id)}>{label}</button>
        ))}
      </div>
      {kpis.data && <KpiRow values={kpis.data.values} cols={4} />}
      <div className="card">
        <div className="card-h"><div className="card-title">{t('Views · history', 'Vistas · histórico')}</div><div className="card-badge">{t('YoY viable', 'YoY viable')}</div></div>
        {history.data && <HistoryChart data={history.data} format="int" />}
      </div>
      <div className="g2" style={{ marginTop: 16 }}>
        <div className="card" style={{ padding: 0 }}>
          <div className="card-h" style={{ padding: '14px 16px 0' }}>
            <div className="card-title">{t('Views ranking · videos published in period', 'Ranking de vistas · videos publicados en el periodo')}</div>
            <div className="card-badge">{t('Period B', 'Periodo B')}</div>
          </div>
          <div style={{ padding: '8px 4px 4px' }}>
            <VideoTable videos={publishedVideos.data ?? []} showPublished empty={t('No videos published in this period.', 'Sin videos publicados en este periodo.')} />
          </div>
        </div>
        <div className="card" style={{ padding: 0 }}>
          <div className="card-h" style={{ padding: '14px 16px 0' }}>
            <div className="card-title">{t('Top 5 content', 'Top 5 contenido')}</div>
            <div className="card-badge">{t('All-time', 'Histórico')}</div>
          </div>
          <div style={{ padding: '8px 4px 4px' }}>
            <VideoTable videos={topVideos.data ?? []} empty={t('No videos yet.', 'Sin videos aún.')} />
          </div>
        </div>
      </div>
      <AiInsights network="youtube" brand={brand} />
    </Collapsible>
  );
}
