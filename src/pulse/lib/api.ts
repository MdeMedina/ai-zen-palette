import type {
  MetaResponse, KpiResponse, SeriesResponse, OverlayResponse, BreakdownResponse,
  ProvenanceRow, Granularity, MultiSeriesResponse,
} from '@/pulse/shared';
import { apiFetch } from '@/lib/api/client';

// Antes esto hablaba directo con el backend de Quincenal Pulse usando un ID token
// de Firebase. Dentro de PKGD OS la sesión es el JWT del operador y el backend de
// PKGD OS hace de proxy autenticado (`/api/pulse/*` → backend de datos), así que
// reutilizamos `apiFetch`: mete el Bearer y comparte el auto-logout en 401.
const get = <T>(path: string): Promise<T> => apiFetch<T>(`/api/pulse${path}`);

const post = <T>(path: string, body: unknown): Promise<T> =>
  apiFetch<T>(`/api/pulse${path}`, { method: 'POST', body });

export interface RankedPost {
  postId: string; brand: string; date: string; productType: string; mediaType: string;
  url: string; caption: string; views: number; reach: number; engagement: number;
  likes: number; comments: number; saved: number; shares: number; engRate: number | null;
}

export const api = {
  meta: () => get<MetaResponse>('/meta'),
  kpis: (g: Granularity, a: string, b: string, keys: string[], opts: { brand?: string; channel?: string } = {}) => {
    const q = new URLSearchParams({ granularity: g, a, b, keys: keys.join(',') });
    if (opts.brand) q.set('brand', opts.brand);
    if (opts.channel) q.set('channel', opts.channel);
    return get<KpiResponse>(`/kpis?${q}`);
  },
  series: (metric: string, g: Granularity, opts: { brand?: string; lang?: string; from?: string; to?: string } = {}) => {
    const q = new URLSearchParams({ metric, granularity: g });
    if (opts.brand) q.set('brand', opts.brand);
    if (opts.lang) q.set('lang', opts.lang);
    if (opts.from) q.set('from', opts.from);
    if (opts.to) q.set('to', opts.to);
    return get<SeriesResponse>(`/series?${q}`);
  },
  /**
   * Varias métricas en la misma serie (gráfico progresivo). Un solo request para
   * que las líneas compartan exactamente los mismos puntos del eje X.
   */
  multiSeries: (metrics: string[], g: Granularity, opts: { brand?: string; lang?: string; from?: string; to?: string } = {}) => {
    const q = new URLSearchParams({ metrics: metrics.join(','), granularity: g });
    if (opts.brand) q.set('brand', opts.brand);
    if (opts.lang) q.set('lang', opts.lang);
    if (opts.from) q.set('from', opts.from);
    if (opts.to) q.set('to', opts.to);
    return get<MultiSeriesResponse>(`/multi-series?${q}`);
  },
  overlay: (metric: string, g: Granularity, a: string, b: string, brand?: string) => {
    const q = new URLSearchParams({ metric, granularity: g, a, b });
    if (brand) q.set('brand', brand);
    return get<OverlayResponse>(`/overlay?${q}`);
  },
  breakdown: (metric: string, g: Granularity, a: string, b: string, brand?: string) => {
    const q = new URLSearchParams({ metric, granularity: g, a, b });
    if (brand) q.set('brand', brand);
    return get<BreakdownResponse>(`/breakdown?${q}`);
  },
  audience: () => get<{ instagram: number | null; facebook: number | null; youtube: number | null; tiktok: number | null; linkedin: number | null; total: number }>('/audience'),
  topEngagement: (opts: { granularity?: string; b?: string; limit?: number } = {}) => {
    const q = new URLSearchParams();
    if (opts.granularity) q.set('granularity', opts.granularity);
    if (opts.b) q.set('b', opts.b);
    if (opts.limit) q.set('limit', String(opts.limit));
    return get<{ platform: string; brand: string; date: string; title: string; url: string; views: number; interactions: number; engRate: number }[]>(`/top-engagement?${q}`);
  },
  videos: (opts: { brand?: string; granularity?: string; b?: string; limit?: number } = {}) => {
    const q = new URLSearchParams();
    if (opts.brand) q.set('brand', opts.brand);
    if (opts.granularity) q.set('granularity', opts.granularity);
    if (opts.b) q.set('b', opts.b);
    if (opts.limit) q.set('limit', String(opts.limit));
    return get<{ videoId: string; title: string; url: string; views: number; minutesWatched: number; likes: number; comments: number }[]>(`/videos?${q}`);
  },
  videosPublished: (opts: { brand?: string; granularity?: string; b?: string; limit?: number } = {}) => {
    const q = new URLSearchParams();
    if (opts.brand) q.set('brand', opts.brand);
    if (opts.granularity) q.set('granularity', opts.granularity);
    if (opts.b) q.set('b', opts.b);
    if (opts.limit) q.set('limit', String(opts.limit));
    return get<{ videoId: string; title: string; url: string; publishedAt: string; views: number; minutesWatched: number; likes: number; comments: number }[]>(`/videos/published?${q}`);
  },
  tiktokTopVideos: (brand?: string, limit = 3) => {
    const q = new URLSearchParams({ limit: String(limit) });
    if (brand) q.set('brand', brand);
    return get<{ videoId: string; brand: string; title: string; url: string; publishedAt: string; views: number; likes: number; comments: number; shares: number }[]>(`/tiktok/top-videos?${q}`);
  },
  posts: (opts: { brand?: string; granularity?: string; b?: string; limit?: number } = {}) => {
    const q = new URLSearchParams();
    if (opts.brand) q.set('brand', opts.brand);
    if (opts.granularity) q.set('granularity', opts.granularity);
    if (opts.b) q.set('b', opts.b);
    if (opts.limit) q.set('limit', String(opts.limit));
    return get<{ postId: string; brand: string; date: string; mediaType: string; productType: string; url: string; caption: string }[]>(`/posts?${q}`);
  },
  stories: (opts: { brand?: string; granularity?: string; b?: string } = {}) => {
    const q = new URLSearchParams();
    if (opts.brand) q.set('brand', opts.brand);
    if (opts.granularity) q.set('granularity', opts.granularity);
    if (opts.b) q.set('b', opts.b);
    return get<{
      stories: { storyId: string; brand: string; date: string; views: number; reach: number; replies: number; url: string }[];
      totals: { views: number; reach: number; replies: number };
      count: number;
    }>(`/stories?${q}`);
  },
  // channel: 'facebook' reusa el mismo ranking para las páginas de Facebook
  // (PostStat guarda ambos canales con el mismo modelo).
  postsRanking: (opts: { brand?: string; granularity?: string; b?: string; top?: number; channel?: string } = {}) => {
    const q = new URLSearchParams();
    if (opts.brand) q.set('brand', opts.brand);
    if (opts.granularity) q.set('granularity', opts.granularity);
    if (opts.b) q.set('b', opts.b);
    if (opts.top) q.set('top', String(opts.top));
    if (opts.channel) q.set('channel', opts.channel);
    return get<{ best: RankedPost[]; worst: RankedPost | null; total: number }>(`/posts/ranking?${q}`);
  },
  provenance: () => get<ProvenanceRow[]>('/provenance'),
  notes: (section: string, a: string, b: string, lang: string, brand?: string) => {
    const q = new URLSearchParams({ section, a, b, lang });
    if (brand) q.set('brand', brand);
    return get<{ body: string }[]>(`/notes?${q}`);
  },
  ensureNote: (p: { section: string; granularity: string; a: string; b: string; brand?: string; langs?: string[] }) =>
    post<{ ok: boolean; notes: { body: string }[] }>('/ai-note/ensure', p),
  topPosts: (brand?: string, limit = 5) => {
    const q = new URLSearchParams({ limit: String(limit) });
    if (brand) q.set('brand', brand);
    return get<{ brand: string; caption: string; permalink: string; postType: string; engagement: number; views: number }[]>(`/top-posts?${q}`);
  },
};
