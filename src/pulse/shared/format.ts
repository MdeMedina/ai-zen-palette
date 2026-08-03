/** Formateo de números compartido (mismo look que los reportes HTML). */

export function formatValue(v: number | null, format?: string): string {
  if (v == null || Number.isNaN(v)) return '—';
  switch (format) {
    case 'pct':
      return `${v.toFixed(1)}%`;
    case 'money':
      return `$${Math.round(v).toLocaleString('en-US')}`;
    case 'money2':
      return `$${v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    case 'float1':
      return v.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
    case 'int':
    default:
      return Math.round(v).toLocaleString('en-US');
  }
}

export function formatDelta(d: number | null): { text: string; dir: 'up' | 'dn' | 'fl' } {
  if (d == null) return { text: '—', dir: 'fl' };
  const dir = d > 0.05 ? 'up' : d < -0.05 ? 'dn' : 'fl';
  const arrow = dir === 'up' ? '▲' : dir === 'dn' ? '▼' : '■';
  const sign = d > 0 ? '+' : '';
  return { text: `${arrow} ${sign}${d.toFixed(1)}%`, dir };
}
