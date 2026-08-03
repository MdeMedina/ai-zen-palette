/**
 * Modelo de periodos y derivación de rangos de fecha.
 *
 * Regla de oro (doc §1): la base se guarda a nivel DIARIO; semana, quincena, mes
 * y año se derivan por consulta. Todo aquí es puro (sin BD) y se comparte entre
 * frontend (selector) y backend (queries).
 *
 * Convención de `id` por granularidad:
 *   day       -> 'YYYY-MM-DD'      (2026-06-16)
 *   week      -> 'YYYY-Www'        (2026-W25)  semana ISO
 *   quincena  -> 'YYYY-MM-Hn'      (2026-06-H2) H1=1–15, H2=16–fin de mes
 *   month     -> 'YYYY-MM'         (2026-06)
 *   year      -> 'YYYY'            (2026)
 */

export const GRANULARITIES = ['day', 'week', 'quincena', 'month', 'year'] as const;
export type Granularity = (typeof GRANULARITIES)[number];

export const GRANULARITY_LABELS: Record<Granularity, { en: string; es: string }> = {
  day: { en: 'Day', es: 'Día' },
  week: { en: 'Week', es: 'Semana' },
  quincena: { en: 'Fortnight', es: 'Quincena' },
  month: { en: 'Month', es: 'Mes' },
  year: { en: 'Year', es: 'Año' },
};

export interface PeriodSpec {
  granularity: Granularity;
  id: string;
}

export interface DateRange {
  /** inclusive, 'YYYY-MM-DD' */
  start: string;
  /** inclusive, 'YYYY-MM-DD' */
  end: string;
}

// ── helpers de fecha (UTC, sin dependencias) ───────────────────────────────
const pad = (n: number) => String(n).padStart(2, '0');
export const iso = (d: Date) => `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
export const parse = (s: string) => new Date(`${s}T00:00:00Z`);
const addDays = (d: Date, n: number) => new Date(d.getTime() + n * 86400000);
const daysInMonth = (y: number, m: number) => new Date(Date.UTC(y, m, 0)).getUTCDate(); // m: 1-12

/** Lunes de la semana ISO que contiene `d`. */
function isoWeekStart(d: Date): Date {
  const day = (d.getUTCDay() + 6) % 7; // 0=lunes
  return addDays(d, -day);
}

/** Número de semana ISO y su año (pueden diferir del año calendario). */
export function isoWeekOf(d: Date): { year: number; week: number } {
  const target = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const dayNr = (target.getUTCDay() + 6) % 7;
  target.setUTCDate(target.getUTCDate() - dayNr + 3); // jueves de esa semana
  const firstThursday = new Date(Date.UTC(target.getUTCFullYear(), 0, 4));
  const firstDayNr = (firstThursday.getUTCDay() + 6) % 7;
  firstThursday.setUTCDate(firstThursday.getUTCDate() - firstDayNr + 3);
  const week = 1 + Math.round((target.getTime() - firstThursday.getTime()) / (7 * 86400000));
  return { year: target.getUTCFullYear(), week };
}

/** Rango [start,end] inclusivo de un periodo. */
export function rangeOf(p: PeriodSpec): DateRange {
  switch (p.granularity) {
    case 'day':
      return { start: p.id, end: p.id };
    case 'week': {
      const [ys, ws] = p.id.split('-W');
      const year = Number(ys);
      const week = Number(ws);
      // Semana 1 ISO = la que contiene el 4 de enero.
      const jan4 = new Date(Date.UTC(year, 0, 4));
      const monday = addDays(isoWeekStart(jan4), (week - 1) * 7);
      return { start: iso(monday), end: iso(addDays(monday, 6)) };
    }
    case 'quincena': {
      const [ys, ms, h] = p.id.split('-');
      const year = Number(ys);
      const month = Number(ms);
      if (h === 'H1') return { start: `${ys}-${pad(month)}-01`, end: `${ys}-${pad(month)}-15` };
      return { start: `${ys}-${pad(month)}-16`, end: `${ys}-${pad(month)}-${pad(daysInMonth(year, month))}` };
    }
    case 'month': {
      const [ys, ms] = p.id.split('-');
      const year = Number(ys);
      const month = Number(ms);
      return { start: `${ys}-${pad(month)}-01`, end: `${ys}-${pad(month)}-${pad(daysInMonth(year, month))}` };
    }
    case 'year':
      return { start: `${p.id}-01-01`, end: `${p.id}-12-31` };
  }
}

/** Nº de días del periodo (para normalización de overlay). */
export function lengthInDays(p: PeriodSpec): number {
  const r = rangeOf(p);
  return Math.round((parse(r.end).getTime() - parse(r.start).getTime()) / 86400000) + 1;
}

/** Etiqueta legible EN/ES de un periodo. */
export function labelOf(p: PeriodSpec, lang: 'en' | 'es' = 'en'): string {
  const MON = {
    en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    es: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
  }[lang];
  const r = rangeOf(p);
  const s = parse(r.start);
  const e = parse(r.end);
  switch (p.granularity) {
    case 'day':
      return `${MON[s.getUTCMonth()]} ${s.getUTCDate()}, ${s.getUTCFullYear()}`;
    case 'week': {
      const [ys, ws] = p.id.split('-W');
      const w = lang === 'en' ? `Week ${Number(ws)}` : `Semana ${Number(ws)}`;
      return `${w} · ${MON[s.getUTCMonth()]} ${s.getUTCDate()}–${e.getUTCDate()}, ${ys}`;
    }
    case 'quincena':
      return `${MON[s.getUTCMonth()]} ${s.getUTCDate()}–${e.getUTCDate()}, ${s.getUTCFullYear()}`;
    case 'month':
      return `${MON[s.getUTCMonth()]} ${s.getUTCFullYear()}`;
    case 'year':
      return p.id;
  }
}

/** Corto (para pills y ejes). */
export function shortLabelOf(p: PeriodSpec, lang: 'en' | 'es' = 'en'): string {
  return labelOf(p, lang);
}

// ── enumeración de periodos disponibles ─────────────────────────────────────
/**
 * Dado el rango de datos [from,to] disponibles, lista los periodos de una
 * granularidad que caen (aunque sea parcialmente) dentro. Se usa para poblar
 * el selector A/B — los que no tienen datos NO se listan (§1: deshabilitados).
 */
export function enumeratePeriods(granularity: Granularity, from: string, to: string): PeriodSpec[] {
  const start = parse(from);
  const end = parse(to);
  const out: PeriodSpec[] = [];
  // Solo se incluyen periodos que SOLAPAN con [from,to] (no futuros ni previos
  // sin datos). Se aplica al final; aquí se declara el filtro.
  const overlaps = (p: PeriodSpec) => {
    const r = rangeOf(p);
    return r.start <= to && r.end >= from;
  };
  if (granularity === 'day') {
    for (let d = start; d.getTime() <= end.getTime(); d = addDays(d, 1)) out.push({ granularity, id: iso(d) });
    return out.filter(overlaps);
  }
  if (granularity === 'week') {
    let cur = isoWeekStart(start);
    const seen = new Set<string>();
    for (; cur.getTime() <= end.getTime(); cur = addDays(cur, 7)) {
      const { year, week } = isoWeekOf(cur);
      const id = `${year}-W${pad(week)}`;
      if (!seen.has(id)) { seen.add(id); out.push({ granularity, id }); }
    }
    return out.filter(overlaps);
  }
  if (granularity === 'year') {
    for (let y = start.getUTCFullYear(); y <= end.getUTCFullYear(); y++) out.push({ granularity, id: String(y) });
    return out.filter(overlaps);
  }
  // month / quincena: iterar mes a mes
  let y = start.getUTCFullYear();
  let m = start.getUTCMonth() + 1;
  const endY = end.getUTCFullYear();
  const endM = end.getUTCMonth() + 1;
  while (y < endY || (y === endY && m <= endM)) {
    if (granularity === 'month') {
      out.push({ granularity, id: `${y}-${pad(m)}` });
    } else {
      out.push({ granularity, id: `${y}-${pad(m)}-H1` });
      out.push({ granularity, id: `${y}-${pad(m)}-H2` });
    }
    m++;
    if (m > 12) { m = 1; y++; }
  }
  return out.filter(overlaps);
}

/** ±% de B respecto a A. null si A es 0 o falta un valor. */
export function delta(a: number | null, b: number | null): number | null {
  if (a == null || b == null || a === 0) return null;
  return ((b - a) / a) * 100;
}
