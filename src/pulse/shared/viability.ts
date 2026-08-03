import type { Granularity } from './periods';
import type { Channel } from './channels';

/**
 * Matriz de viabilidad de gráficos por granularidad y canal (doc §2).
 *  ok    (✅) viable
 *  caveat(⚠️) con salvedad
 *  snapshot(🔨) solo si la app guarda snapshots desde hoy
 *  no    (❌) no confiable
 */
export type Viability = 'ok' | 'caveat' | 'snapshot' | 'no';

/** Ejes de la matriz. `ig_followers` se separa de `instagram` (engagement). */
export type ViabilityChannel =
  | 'ga4'
  | 'google_ads'
  | 'instagram'
  | 'ig_followers'
  | 'youtube'
  | 'tiktok';

// filas = granularidad de comparación; columnas = canal.
export const VIABILITY: Record<Granularity, Record<ViabilityChannel, Viability>> = {
  day: { ga4: 'caveat', google_ads: 'caveat', instagram: 'caveat', ig_followers: 'snapshot', youtube: 'no', tiktok: 'no' },
  week: { ga4: 'ok', google_ads: 'ok', instagram: 'ok', ig_followers: 'snapshot', youtube: 'ok', tiktok: 'no' },
  quincena: { ga4: 'ok', google_ads: 'ok', instagram: 'ok', ig_followers: 'snapshot', youtube: 'ok', tiktok: 'no' },
  month: { ga4: 'ok', google_ads: 'ok', instagram: 'ok', ig_followers: 'snapshot', youtube: 'ok', tiktok: 'no' },
  year: { ga4: 'ok', google_ads: 'ok', instagram: 'no', ig_followers: 'no', youtube: 'ok', tiktok: 'no' }, // Ads YoY: * si la cuenta existía en 2025
};

export const VIABILITY_NOTES: { en: string; es: string }[] = [
  {
    en: 'Day × day: "today" is a partial day → compare closed days or flag today as provisional. YouTube is unreliable daily (~2-day latency); TikTok views read 0 (connector bug).',
    es: 'Día × día: "hoy" es un día parcial → comparar días cerrados o marcar hoy como provisional. YouTube no sirve a diario (latencia ~2 días); TikTok views está en 0 por bug del conector.',
  },
  {
    en: 'Year over year: only real for GA4, YouTube and Ads (they have 2025 history in Windsor). Instagram YoY and followers YoY are garbage until we accumulate our own history.',
    es: 'Año contra año: solo real para GA4, YouTube y Ads (tienen histórico 2025 en Windsor). El YoY de Instagram y de seguidores es basura hasta acumular histórico propio.',
  },
  {
    en: 'Instagram followers & all IG history: only built going forward; Windsor does not provide the past. Those lines start empty until the app accumulates snapshots.',
    es: 'Seguidores de Instagram e histórico de IG: solo se construye hacia adelante; Windsor no da el pasado. Esas líneas arrancan vacías hasta que la app acumule snapshots.',
  },
];

/** Cuándo NO poner gráfico: si solo hay 2 valores → KPI+delta. El gráfico entra con ≥ este nº de puntos. */
export const MIN_POINTS_FOR_CHART = 6;

/** Estado de provenance por fuente (doc §9). */
export type ProvenanceStatus = 'complete' | 'partial' | 'anomaly' | 'excluded';
export const PROVENANCE_LABELS: Record<ProvenanceStatus, { en: string; es: string }> = {
  complete: { en: 'Complete', es: 'Completo' },
  partial: { en: 'Partial', es: 'Parcial' },
  anomaly: { en: 'Anomaly', es: 'Anómalo' },
  excluded: { en: 'Excluded', es: 'Excluido' },
};
