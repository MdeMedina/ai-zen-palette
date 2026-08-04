/**
 * Ventana del gráfico progresivo (Alcance + Vistas por mes).
 *
 * Es deliberadamente INDEPENDIENTE del selector A/B: el gráfico muestra la
 * trayectoria del año, no la comparación quincenal. Se comparte entre Instagram
 * y Facebook para que las dos secciones cubran exactamente el mismo tramo.
 */

/** Nº de meses de la ventana (13 = año en curso + el mismo mes del año pasado). */
export const PROGRESSIVE_MONTHS = 13;

/**
 * Rango [from,to] de los últimos `months` meses, alineado a mes completo:
 * `from` es el día 1 del mes más antiguo y `to` es hoy. Alinear al día 1 evita
 * que el mes más viejo aparezca truncado (y por tanto artificialmente bajo).
 */
export function lastMonthsRange(months = PROGRESSIVE_MONTHS): { from: string; to: string } {
  const pad = (n: number) => String(n).padStart(2, '0');
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (months - 1), 1));
  const iso = (d: Date) => `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
  return { from: iso(start), to: iso(now) };
}
