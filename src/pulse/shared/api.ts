import type { Granularity, PeriodSpec } from './periods';
import type { Brand, Channel } from './channels';

/** Contrato de la API entre backend y frontend. */

/** GET /api/meta -> qué se puede seleccionar (periodos con datos por granularidad). */
export interface MetaResponse {
  dataRange: { from: string; to: string } | null;
  /**
   * Rango de datos por canal. El histórico NO es uniforme (Instagram y Facebook
   * llegan 13 meses atrás por el backfill; el resto, ~90 días), así que el
   * selector avisa cuando el periodo elegido precede al histórico de un canal.
   */
  channelRanges?: Record<string, { from: string; to: string }>;
  /** periodos disponibles por granularidad (solo con datos) */
  periods: Record<Granularity, PeriodSpec[]>;
  windsorConfigured: boolean;
  lastSync: string | null;
}

/** Un valor de métrica para A y B con su delta. */
export interface KpiValue {
  key: string;
  label: { en: string; es: string };
  origin: 'F' | 'D' | 'IA';
  format?: string;
  a: number | null;
  b: number | null;
  /** ±% de B vs A */
  delta: number | null;
}

/** Petición de KPIs: par A/B + filtro opcional por marca/canal. */
export interface KpiQuery {
  granularity: Granularity;
  a: string; // period id
  b: string; // period id
  brand?: Brand;
  channel?: Channel;
  keys?: string[];
}

export interface KpiResponse {
  a: PeriodSpec;
  b: PeriodSpec;
  values: KpiValue[];
}

/** Serie histórica (modo histórico). */
export interface SeriesPoint {
  /** id del sub-periodo (fecha o etiqueta) */
  t: string;
  label: string;
  value: number | null;
}

export interface SeriesResponse {
  metric: string;
  granularity: Granularity;
  brand?: Brand;
  points: SeriesPoint[];
}

/**
 * Serie con VARIAS métricas alineadas en los mismos puntos (GET /api/multi-series).
 * Es el contrato del gráfico progresivo (Alcance + Vistas por mes): un solo
 * request garantiza que las dos líneas comparten eje X.
 */
export interface MultiSeriesPoint {
  t: string;
  label: string;
  /** key de métrica → valor en ese periodo */
  values: Record<string, number | null>;
}

export interface MultiSeriesResponse {
  granularity: Granularity;
  brand: Brand | null;
  metrics: { key: string; label: { en: string; es: string }; format?: string }[];
  points: MultiSeriesPoint[];
}

/** Overlay A vs B normalizado por posición (doc §2). */
export interface OverlayResponse {
  metric: string;
  a: { period: PeriodSpec; points: { pos: number; value: number | null }[] };
  b: { period: PeriodSpec; points: { pos: number; value: number | null }[] };
  /** true si se normalizó a % de avance (longitudes distintas) */
  normalizedByPct: boolean;
  delta: number | null;
}

/** Breakdown/composición (traffic by channel, engagement breakdown...). */
export interface BreakdownItem {
  key: string;
  label: string;
  a: number | null;
  b: number | null;
  delta: number | null;
}
export interface BreakdownResponse {
  dimension: string;
  items: BreakdownItem[];
}

export interface ProvenanceRow {
  channel: Channel;
  status: 'complete' | 'partial' | 'anomaly' | 'excluded';
  note: { en: string; es: string };
  lastDate: string | null;
}
