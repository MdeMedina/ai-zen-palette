import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Granularity, MetaResponse, PeriodSpec } from '@/pulse/shared';
import { api } from '../lib/api';

interface PeriodsCtx {
  meta: MetaResponse | null;
  loading: boolean;
  granularity: Granularity;
  setGranularity: (g: Granularity) => void;
  a: string;
  b: string;
  setA: (id: string) => void;
  setB: (id: string) => void;
  options: PeriodSpec[];
}

const Ctx = createContext<PeriodsCtx | null>(null);

export function PeriodsProvider({ children }: { children: ReactNode }) {
  const [meta, setMeta] = useState<MetaResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [granularity, setGranularity] = useState<Granularity>('quincena');
  const [a, setA] = useState('');
  const [b, setB] = useState('');

  useEffect(() => {
    api.meta().then((m) => { setMeta(m); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const options = useMemo(() => meta?.periods[granularity] ?? [], [meta, granularity]);

  // Al cambiar granularidad (o al cargar meta), fija A = penúltimo, B = último.
  useEffect(() => {
    if (options.length === 0) { setA(''); setB(''); return; }
    const last = options[options.length - 1].id;
    const prev = options.length >= 2 ? options[options.length - 2].id : last;
    setB(last);
    setA(prev);
  }, [options]);

  return (
    <Ctx.Provider value={{ meta, loading, granularity, setGranularity, a, b, setA, setB, options }}>
      {children}
    </Ctx.Provider>
  );
}

export function usePeriods() {
  const c = useContext(Ctx);
  if (!c) throw new Error('usePeriods fuera de PeriodsProvider');
  return c;
}
