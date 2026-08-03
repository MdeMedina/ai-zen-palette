import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  BarChart, Bar, Legend, Cell,
} from 'recharts';
import {
  formatValue, MIN_POINTS_FOR_CHART, labelOf,
  type SeriesResponse, type OverlayResponse, type BreakdownResponse, type PeriodSpec,
} from '@/pulse/shared';
import { useI18n } from '../lib/i18n';
import { Delta } from './Delta';

const C = {
  a: '#2860a0', b: '#5a6e3c', yellow: '#c8a000', ink: '#1c1a16',
  grid: '#c4c0b8', mute: '#9c978c',
};

const tooltipStyle = {
  fontFamily: 'JetBrains Mono, monospace', fontSize: 11,
  background: '#f2efe9', border: '1px solid #c4c0b8', borderRadius: 0,
};

/** Modo histórico: serie temporal de una métrica. Gate de ≥6 puntos (doc §2). */
export function HistoryChart({ data, format, height = 200 }: { data: SeriesResponse; format?: string; height?: number }) {
  const { t } = useI18n();
  const points = data.points.filter((p) => p.value != null);
  if (points.length < MIN_POINTS_FOR_CHART) {
    return <div className="loading">{t('Not enough points for a chart yet (need ≥6).', 'Aún no hay suficientes puntos para un gráfico (≥6).')}</div>;
  }
  return (
    <div className="chart-wrap">
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={points} margin={{ top: 8, right: 12, bottom: 4, left: 0 }}>
          <CartesianGrid stroke={C.grid} strokeDasharray="2 3" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 9 }} interval="preserveStartEnd" />
          <YAxis tick={{ fontSize: 9 }} width={44} tickFormatter={(v) => formatValue(v, format)} />
          <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => formatValue(v, format)} />
          <Line type="monotone" dataKey="value" stroke={C.b} strokeWidth={2} dot={{ r: 2 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Overlay normalizado por posición: A vs B en el mismo eje (doc §2). */
export function OverlayChart({ data, format, aPeriod, bPeriod, height = 220 }:
{ data: OverlayResponse; format?: string; aPeriod: PeriodSpec; bPeriod: PeriodSpec; height?: number }) {
  const { lang, t } = useI18n();
  const n = Math.max(data.a.points.length, data.b.points.length);
  const merged = Array.from({ length: n }, (_, i) => ({
    pos: data.normalizedByPct
      ? (data.a.points[i]?.pos ?? data.b.points[i]?.pos ?? 0) + '%'
      : String(i + 1),
    A: data.a.points[i]?.value ?? null,
    B: data.b.points[i]?.value ?? null,
  }));
  return (
    <div className="chart-wrap">
      <div className="chart-title-row">
        <span className="sel-tag">
          {data.normalizedByPct ? t('normalized to % of period', 'normalizado a % del periodo') : t('by day position', 'por posición de día')}
        </span>
        <span className="chart-delta"><Delta value={data.delta} /> B {t('vs', 'vs')} A</span>
      </div>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={merged} margin={{ top: 8, right: 12, bottom: 4, left: 0 }}>
          <CartesianGrid stroke={C.grid} strokeDasharray="2 3" vertical={false} />
          <XAxis dataKey="pos" tick={{ fontSize: 9 }} />
          <YAxis tick={{ fontSize: 9 }} width={44} tickFormatter={(v) => formatValue(v, format)} />
          <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => formatValue(v, format)} />
          <Legend wrapperStyle={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10 }} />
          <Line name={`A · ${labelOf(aPeriod, lang)}`} type="monotone" dataKey="A" stroke={C.a} strokeWidth={2} dot={false} />
          <Line name={`B · ${labelOf(bPeriod, lang)}`} type="monotone" dataKey="B" stroke={C.b} strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Barras agrupadas A vs B por dimensión (breakdown / composición). */
export function BreakdownBars({ data, format, height = 260 }: { data: BreakdownResponse; format?: string; height?: number }) {
  const { t } = useI18n();
  const rows = data.items.map((it) => ({ label: it.label, A: it.a ?? 0, B: it.b ?? 0 }));
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={rows} layout="vertical" margin={{ top: 4, right: 16, bottom: 4, left: 8 }}>
        <CartesianGrid stroke={C.grid} strokeDasharray="2 3" horizontal={false} />
        <XAxis type="number" tick={{ fontSize: 9 }} tickFormatter={(v) => formatValue(v, format)} />
        <YAxis type="category" dataKey="label" tick={{ fontSize: 9 }} width={110} />
        <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => formatValue(v, format)} />
        <Legend wrapperStyle={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10 }} />
        <Bar name={t('Period A', 'Periodo A')} dataKey="A" fill={C.a} />
        <Bar name={t('Period B', 'Periodo B')} dataKey="B" fill={C.b} />
      </BarChart>
    </ResponsiveContainer>
  );
}

/** Composición apilada, dos columnas (A vs B) para desgloses. */
export function StackedCompare({ items, format, height = 240 }:
{ items: { key: string; label: string; a: number | null; b: number | null }[]; format?: string; height?: number }) {
  const { t } = useI18n();
  const palette = ['#5a6e3c', '#c8a000', '#2860a0', '#b87820', '#6030a0', '#b83830'];
  const rowA: Record<string, number | string> = { period: t('Period A', 'Periodo A') };
  const rowB: Record<string, number | string> = { period: t('Period B', 'Periodo B') };
  items.forEach((it) => { rowA[it.label] = it.a ?? 0; rowB[it.label] = it.b ?? 0; });
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={[rowA, rowB]} margin={{ top: 8, right: 12, bottom: 4, left: 0 }}>
        <CartesianGrid stroke={C.grid} strokeDasharray="2 3" vertical={false} />
        <XAxis dataKey="period" tick={{ fontSize: 10 }} />
        <YAxis tick={{ fontSize: 9 }} width={44} tickFormatter={(v) => formatValue(v, format)} />
        <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => formatValue(v, format)} />
        <Legend wrapperStyle={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10 }} />
        {items.map((it, i) => (
          <Bar key={it.key} dataKey={it.label} stackId="s" fill={palette[i % palette.length]} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

/** Sparkline mini para tiles ejecutivos. */
export function Sparkline({ data, height = 34 }: { data: SeriesResponse; height?: number }) {
  const points = data.points.filter((p) => p.value != null);
  if (points.length < 3) return null;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={points} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
        <Line type="monotone" dataKey="value" stroke="#7cb87c" strokeWidth={1.5} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

/** Barras horizontales simples (ranking) usando CSS del sistema. */
export function RankBars({ items, format }: { items: { label: string; value: number | null }[]; format?: string }) {
  const max = Math.max(1, ...items.map((i) => i.value ?? 0));
  return (
    <div>
      {items.map((it) => (
        <div className="bar-row" key={it.label}>
          <div className="bar-label" title={it.label}>{it.label}</div>
          <div className="bar-track"><div className="bar-fill" style={{ width: `${((it.value ?? 0) / max) * 100}%` }} /></div>
          <div className="bar-val">{formatValue(it.value, format)}</div>
        </div>
      ))}
    </div>
  );
}
