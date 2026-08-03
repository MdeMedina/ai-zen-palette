import { createContext, useContext, useState, type ReactNode } from 'react';

export type Lang = 'en' | 'es';

interface I18nCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (en: string, es: string) => string;
  tl: (label: { en: string; es: string }) => string;
}

const Ctx = createContext<I18nCtx>({ lang: 'en', setLang: () => {}, t: (en) => en, tl: (l) => l.en });

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>('en');
  const t = (en: string, es: string) => (lang === 'en' ? en : es);
  const tl = (l: { en: string; es: string }) => l[lang];
  return <Ctx.Provider value={{ lang, setLang, t, tl }}>{children}</Ctx.Provider>;
}

export const useI18n = () => useContext(Ctx);
