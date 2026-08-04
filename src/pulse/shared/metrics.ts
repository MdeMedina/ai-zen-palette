import type { Channel } from './channels';

/**
 * Origen de cada métrica (leyenda del documento de diseño §1):
 *  F  = Fuente: se jala de Windsor.ai y se guarda a diario (~25).
 *  D  = Derivada: la app la calcula a partir de las [F] (ratios, sumas, argmax). No se guarda.
 *  IA = Generada: slot que rellena una IA vía n8n (notas y análisis).
 */
export type Origin = 'F' | 'D' | 'IA';

/**
 * Cómo se colapsa una serie diaria a un periodo (semana/quincena/mes/año).
 *  sum   -> flujo acumulable (sessions, spend, reach, interactions...).
 *  last  -> stock / snapshot (followers): el valor del último día del periodo.
 *  avg   -> promedio diario (avg watch time).
 *  ratio -> derivada: se recalcula desde sus componentes sumados (NO se promedian ratios).
 *  argmax/argmin -> derivada de selección (best/worst campaign, best day...).
 */
export type Aggregation = 'sum' | 'last' | 'avg' | 'ratio' | 'argmax' | 'argmin';

export interface MetricDef {
  key: string;
  channel: Channel | 'portfolio';
  label: { en: string; es: string };
  origin: Origin;
  agg: Aggregation;
  /** formato de presentación */
  format?: 'int' | 'float1' | 'pct' | 'money' | 'money2';
  /** para ratios [D]: numerador/denominador (keys de métricas [F]) */
  ratioOf?: { num: string; den: string };
  unit?: string;
}

/**
 * Catálogo canónico. Las [F] son las que el conector Windsor cablea y se guardan
 * a nivel diario; las [D] las calcula la derivación en runtime; las [IA] las llena n8n.
 * (Redundancias ya eliminadas: Cost/Conv+Conv.CPA->CPA, Minutos->Min.Watched, etc.)
 */
export const METRICS: MetricDef[] = [
  // ── 1 · Web / GA4 ──
  { key: 'sessions', channel: 'ga4', label: { en: 'Sessions', es: 'Sesiones' }, origin: 'F', agg: 'sum', format: 'int' },
  { key: 'active_users', channel: 'ga4', label: { en: 'Active Users', es: 'Usuarios Activos' }, origin: 'F', agg: 'sum', format: 'int' },
  { key: 'new_users', channel: 'ga4', label: { en: 'New Users', es: 'Usuarios Nuevos' }, origin: 'F', agg: 'sum', format: 'int' },
  { key: 'engaged_sessions', channel: 'ga4', label: { en: 'Engaged Sessions', es: 'Sesiones Enganchadas' }, origin: 'F', agg: 'sum', format: 'int' },
  { key: 'page_views', channel: 'ga4', label: { en: 'Page Views', es: 'Páginas Vistas' }, origin: 'F', agg: 'sum', format: 'int' },
  { key: 'engagement_rate', channel: 'ga4', label: { en: 'Engagement Rate', es: 'Tasa de Engagement' }, origin: 'D', agg: 'ratio', format: 'pct', ratioOf: { num: 'engaged_sessions', den: 'sessions' } },

  // ── 2 · Paid · Google Ads ──
  { key: 'spend', channel: 'google_ads', label: { en: 'Spend', es: 'Inversión' }, origin: 'F', agg: 'sum', format: 'money' },
  { key: 'impressions', channel: 'google_ads', label: { en: 'Impressions', es: 'Impresiones' }, origin: 'F', agg: 'sum', format: 'int' },
  { key: 'clicks', channel: 'google_ads', label: { en: 'Clicks', es: 'Clics' }, origin: 'F', agg: 'sum', format: 'int' },
  { key: 'conversions', channel: 'google_ads', label: { en: 'Conversions', es: 'Conversiones' }, origin: 'F', agg: 'sum', format: 'float1' },
  { key: 'ctr', channel: 'google_ads', label: { en: 'CTR', es: 'CTR' }, origin: 'D', agg: 'ratio', format: 'pct', ratioOf: { num: 'clicks', den: 'impressions' } },
  { key: 'cpc', channel: 'google_ads', label: { en: 'CPC', es: 'CPC' }, origin: 'D', agg: 'ratio', format: 'money2', ratioOf: { num: 'spend', den: 'clicks' } },
  { key: 'cpa', channel: 'google_ads', label: { en: 'CPA', es: 'CPA' }, origin: 'D', agg: 'ratio', format: 'money2', ratioOf: { num: 'spend', den: 'conversions' } },
  { key: 'conv_rate', channel: 'google_ads', label: { en: 'Conv. Rate', es: 'Tasa de Conversión' }, origin: 'D', agg: 'ratio', format: 'pct', ratioOf: { num: 'conversions', den: 'clicks' } },

  // ── 2b · Meta Ads (Facebook/Instagram Ads) ──
  { key: 'meta_spend', channel: 'meta_ads', label: { en: 'Spend', es: 'Inversión' }, origin: 'F', agg: 'sum', format: 'money' },
  { key: 'meta_impressions', channel: 'meta_ads', label: { en: 'Impressions', es: 'Impresiones' }, origin: 'F', agg: 'sum', format: 'int' },
  { key: 'meta_clicks', channel: 'meta_ads', label: { en: 'Clicks', es: 'Clics' }, origin: 'F', agg: 'sum', format: 'int' },
  { key: 'meta_reach', channel: 'meta_ads', label: { en: 'Reach', es: 'Alcance' }, origin: 'F', agg: 'sum', format: 'int' },
  // Meta aquí corre campañas de tráfico/leads (sin evento de compra), así que
  // "conversions" viene vacío; el resultado real es el clic al enlace.
  { key: 'meta_link_clicks', channel: 'meta_ads', label: { en: 'Link Clicks', es: 'Clics al Enlace' }, origin: 'F', agg: 'sum', format: 'int' },
  { key: 'meta_ctr', channel: 'meta_ads', label: { en: 'CTR', es: 'CTR' }, origin: 'D', agg: 'ratio', format: 'pct', ratioOf: { num: 'meta_clicks', den: 'meta_impressions' } },
  { key: 'meta_cpc', channel: 'meta_ads', label: { en: 'CPC', es: 'CPC' }, origin: 'D', agg: 'ratio', format: 'money2', ratioOf: { num: 'meta_spend', den: 'meta_clicks' } },
  { key: 'meta_cplc', channel: 'meta_ads', label: { en: 'Cost / Link Click', es: 'Costo / Clic Enlace' }, origin: 'D', agg: 'ratio', format: 'money2', ratioOf: { num: 'meta_spend', den: 'meta_link_clicks' } },

  // ── 3 · Instagram ──
  { key: 'ig_reach', channel: 'instagram', label: { en: 'Reach', es: 'Alcance' }, origin: 'F', agg: 'sum', format: 'int' },
  { key: 'ig_accounts_engaged', channel: 'instagram', label: { en: 'Accounts Engaged', es: 'Cuentas Enganchadas' }, origin: 'F', agg: 'sum', format: 'int' },
  { key: 'ig_interactions', channel: 'instagram', label: { en: 'Interactions', es: 'Interacciones' }, origin: 'F', agg: 'sum', format: 'int' },
  { key: 'ig_views', channel: 'instagram', label: { en: 'Views', es: 'Vistas' }, origin: 'F', agg: 'sum', format: 'int' },
  { key: 'ig_followers', channel: 'instagram', label: { en: 'Followers', es: 'Seguidores' }, origin: 'F', agg: 'last', format: 'int' },
  { key: 'ig_posts', channel: 'instagram', label: { en: 'Publications', es: 'Publicaciones' }, origin: 'F', agg: 'sum', format: 'int' },
  { key: 'ig_story_views', channel: 'instagram', label: { en: 'Story Views', es: 'Vistas de Historias' }, origin: 'F', agg: 'sum', format: 'int' },
  { key: 'ig_story_reach', channel: 'instagram', label: { en: 'Story Reach', es: 'Alcance de Historias' }, origin: 'F', agg: 'sum', format: 'int' },
  { key: 'ig_likes', channel: 'instagram', label: { en: 'Likes', es: 'Likes' }, origin: 'F', agg: 'sum', format: 'int' },
  { key: 'ig_comments', channel: 'instagram', label: { en: 'Comments', es: 'Comentarios' }, origin: 'F', agg: 'sum', format: 'int' },
  { key: 'ig_saves', channel: 'instagram', label: { en: 'Saves', es: 'Guardados' }, origin: 'F', agg: 'sum', format: 'int' },
  { key: 'ig_shares', channel: 'instagram', label: { en: 'Shares', es: 'Shares' }, origin: 'F', agg: 'sum', format: 'int' },
  { key: 'ig_eng_rate', channel: 'instagram', label: { en: 'Engagement Rate', es: 'Tasa de Engagement' }, origin: 'D', agg: 'ratio', format: 'pct', ratioOf: { num: 'ig_interactions', den: 'ig_reach' } },
  { key: 'ig_net_followers', channel: 'instagram', label: { en: 'Net Follower Growth', es: 'Crecimiento Neto Seguidores' }, origin: 'D', agg: 'sum', format: 'int' },

  // ── 3b · Facebook (páginas orgánicas, conector facebook_organic) ──
  // Espejo de Instagram. Nombres Windsor → nuestro: page_impressions_unique es el
  // ALCANCE (personas únicas) y page_impressions son las VISTAS/impresiones del
  // contenido de la página — Facebook no publica una métrica "views" unificada
  // como Instagram, así que las impresiones son su equivalente más cercano.
  { key: 'fb_reach', channel: 'facebook', label: { en: 'Reach', es: 'Alcance' }, origin: 'F', agg: 'sum', format: 'int' },
  { key: 'fb_views', channel: 'facebook', label: { en: 'Views (impressions)', es: 'Vistas (impresiones)' }, origin: 'F', agg: 'sum', format: 'int' },
  { key: 'fb_interactions', channel: 'facebook', label: { en: 'Interactions', es: 'Interacciones' }, origin: 'F', agg: 'sum', format: 'int' },
  { key: 'fb_followers', channel: 'facebook', label: { en: 'Followers', es: 'Seguidores' }, origin: 'F', agg: 'last', format: 'int' },
  { key: 'fb_posts', channel: 'facebook', label: { en: 'Publications', es: 'Publicaciones' }, origin: 'F', agg: 'sum', format: 'int' },
  { key: 'fb_reactions', channel: 'facebook', label: { en: 'Reactions', es: 'Reacciones' }, origin: 'F', agg: 'sum', format: 'int' },
  { key: 'fb_video_views', channel: 'facebook', label: { en: 'Video Views', es: 'Vistas de Video' }, origin: 'F', agg: 'sum', format: 'int' },
  { key: 'fb_page_views', channel: 'facebook', label: { en: 'Page Visits', es: 'Visitas a la Página' }, origin: 'F', agg: 'sum', format: 'int' },
  { key: 'fb_eng_rate', channel: 'facebook', label: { en: 'Engagement Rate', es: 'Tasa de Engagement' }, origin: 'D', agg: 'ratio', format: 'pct', ratioOf: { num: 'fb_interactions', den: 'fb_reach' } },
  // Neto = page_daily_follows − page_daily_unfollows, calculado en la ingesta
  // (el catálogo no tiene una agregación "resta"), igual que ig_net_followers.
  { key: 'fb_net_followers', channel: 'facebook', label: { en: 'Net Follower Growth', es: 'Crecimiento Neto Seguidores' }, origin: 'D', agg: 'sum', format: 'int' },

  // ── 4 · YouTube ──
  { key: 'yt_views', channel: 'youtube', label: { en: 'Views', es: 'Vistas' }, origin: 'F', agg: 'sum', format: 'int' },
  { key: 'yt_minutes_watched', channel: 'youtube', label: { en: 'Min. Watched', es: 'Min. Vistos' }, origin: 'F', agg: 'sum', format: 'int' },
  { key: 'yt_likes', channel: 'youtube', label: { en: 'Likes', es: 'Likes' }, origin: 'F', agg: 'sum', format: 'int' },
  { key: 'yt_subscribers', channel: 'youtube', label: { en: 'Subscribers', es: 'Suscriptores' }, origin: 'F', agg: 'last', format: 'int' },
  { key: 'yt_net_subscribers', channel: 'youtube', label: { en: 'Net Subscribers', es: 'Suscriptores Netos' }, origin: 'F', agg: 'sum', format: 'int' },
  { key: 'yt_comments', channel: 'youtube', label: { en: 'Comments', es: 'Comentarios' }, origin: 'F', agg: 'sum', format: 'int' },

  // ── 5 · TikTok ──
  { key: 'tt_views', channel: 'tiktok', label: { en: 'Video Views', es: 'Vistas de Video' }, origin: 'F', agg: 'sum', format: 'int' },
  { key: 'tt_likes', channel: 'tiktok', label: { en: 'Likes', es: 'Likes' }, origin: 'F', agg: 'sum', format: 'int' },
  { key: 'tt_avg_watch_time', channel: 'tiktok', label: { en: 'Avg. Watch Time', es: 'Tiempo Prom. Visto' }, origin: 'F', agg: 'avg', format: 'float1', unit: 's' },
  { key: 'tt_followers', channel: 'tiktok', label: { en: 'Followers', es: 'Seguidores' }, origin: 'F', agg: 'last', format: 'int' },
  { key: 'tt_net_followers', channel: 'tiktok', label: { en: 'Net Followers', es: 'Seguidores Netos' }, origin: 'F', agg: 'sum', format: 'int' },
  { key: 'tt_posts', channel: 'tiktok', label: { en: 'Publications', es: 'Publicaciones' }, origin: 'F', agg: 'sum', format: 'int' },

  // ── 6 · LinkedIn ──
  { key: 'li_followers', channel: 'linkedin', label: { en: 'Followers', es: 'Seguidores' }, origin: 'F', agg: 'last', format: 'int' },
  { key: 'li_impressions', channel: 'linkedin', label: { en: 'Impressions', es: 'Impresiones' }, origin: 'F', agg: 'sum', format: 'int' },
  { key: 'li_unique_impressions', channel: 'linkedin', label: { en: 'Unique Impressions', es: 'Impresiones Únicas' }, origin: 'F', agg: 'sum', format: 'int' },
  { key: 'li_likes', channel: 'linkedin', label: { en: 'Reactions', es: 'Reacciones' }, origin: 'F', agg: 'sum', format: 'int' },
  { key: 'li_comments', channel: 'linkedin', label: { en: 'Comments', es: 'Comentarios' }, origin: 'F', agg: 'sum', format: 'int' },
  { key: 'li_posts', channel: 'linkedin', label: { en: 'Posts', es: 'Publicaciones' }, origin: 'F', agg: 'sum', format: 'int' },
  { key: 'li_engagement_rate', channel: 'linkedin', label: { en: 'Engagement Rate', es: 'Tasa de Engagement' }, origin: 'D', agg: 'ratio', format: 'pct', ratioOf: { num: 'li_likes', den: 'li_impressions' } },

  // ── 7 · Klaviyo ──
  { key: 'kl_emails_sent', channel: 'klaviyo', label: { en: 'Emails Sent', es: 'Emails Enviados' }, origin: 'F', agg: 'sum', format: 'int' },
  { key: 'kl_opens', channel: 'klaviyo', label: { en: 'Opens', es: 'Aperturas' }, origin: 'F', agg: 'sum', format: 'int' },
  { key: 'kl_clicks', channel: 'klaviyo', label: { en: 'Clicks', es: 'Clics' }, origin: 'F', agg: 'sum', format: 'int' },
  { key: 'kl_new_subscribers', channel: 'klaviyo', label: { en: 'New Subscribers', es: 'Nuevos Suscriptores' }, origin: 'F', agg: 'sum', format: 'int' },
  { key: 'kl_unsubscribes', channel: 'klaviyo', label: { en: 'Unsubscribes', es: 'Bajas' }, origin: 'F', agg: 'sum', format: 'int' },
  { key: 'kl_open_rate', channel: 'klaviyo', label: { en: 'Open Rate', es: 'Tasa de Apertura' }, origin: 'D', agg: 'ratio', format: 'pct', ratioOf: { num: 'kl_opens', den: 'kl_emails_sent' } },
  { key: 'kl_click_rate', channel: 'klaviyo', label: { en: 'Click Rate', es: 'Tasa de Clics' }, origin: 'D', agg: 'ratio', format: 'pct', ratioOf: { num: 'kl_clicks', den: 'kl_emails_sent' } },
  { key: 'kl_net_subscribers', channel: 'klaviyo', label: { en: 'Net Subscribers', es: 'Suscriptores Netos' }, origin: 'D', agg: 'sum', format: 'int' },
];

export const METRIC_BY_KEY: Record<string, MetricDef> = Object.fromEntries(
  METRICS.map((m) => [m.key, m]),
);

/** Solo las métricas [F] — las que el conector Windsor guarda a diario. */
export const SOURCE_METRICS = METRICS.filter((m) => m.origin === 'F');

/**
 * Slots [IA] del dashboard: cada sección que muestra una nota generada por IA.
 * El agente de n8n genera un `body` por (section, periodId, lang [, brand]).
 */
export const AI_SECTIONS = [
  'ga4', 'google_ads', 'meta_ads', 'instagram', 'facebook', 'youtube', 'tiktok', 'linkedin', 'klaviyo', 'highlights', 'next_steps',
] as const;
export type AiSection = (typeof AI_SECTIONS)[number];

/**
 * Métricas relevantes por sección (las que alimentan el contexto que recibe la IA).
 * Highlights usa un resumen transversal de titulares del portafolio.
 */
export const SECTION_METRICS: Record<AiSection, string[]> = {
  ga4: ['sessions', 'active_users', 'new_users', 'engaged_sessions', 'page_views', 'engagement_rate'],
  google_ads: ['spend', 'impressions', 'clicks', 'conversions', 'ctr', 'cpc', 'cpa', 'conv_rate'],
  meta_ads: ['meta_spend', 'meta_impressions', 'meta_reach', 'meta_clicks', 'meta_link_clicks', 'meta_ctr', 'meta_cpc', 'meta_cplc'],
  instagram: ['ig_reach', 'ig_views', 'ig_interactions', 'ig_shares', 'ig_eng_rate'],
  facebook: ['fb_reach', 'fb_views', 'fb_interactions', 'fb_followers', 'fb_net_followers', 'fb_eng_rate'],
  youtube: ['yt_views', 'yt_minutes_watched', 'yt_likes'],
  tiktok: ['tt_likes', 'tt_avg_watch_time', 'tt_net_followers'],
  linkedin: ['li_impressions', 'li_followers', 'li_posts'],
  klaviyo: ['kl_emails_sent', 'kl_opens', 'kl_clicks', 'kl_open_rate', 'kl_click_rate', 'kl_net_subscribers'],
  highlights: ['sessions', 'spend', 'conversions', 'ig_reach', 'ig_interactions', 'yt_views'],
  next_steps: ['sessions', 'spend', 'conversions', 'ig_reach', 'ig_interactions', 'yt_views'],
};
