import { useState } from 'react';
import { labelOf } from '@/pulse/shared';
import { useI18n } from './lib/i18n';
import { usePeriods } from './state/periods';
import { PeriodSelector } from './components/PeriodSelector';
import { Executive } from './sections/Executive';
import { Web } from './sections/Web';
import { Paid } from './sections/Paid';
import { MetaAds } from './sections/MetaAds';
import { Instagram } from './sections/Instagram';
import { YouTube } from './sections/YouTube';
import { TikTok } from './sections/TikTok';
import { LinkedIn } from './sections/LinkedIn';
import { Provenance } from './sections/Provenance';
import { useSessionStore } from '@/stores/session';
import { forceLogout } from '@/lib/auth/logout';
import { authApi } from '@/lib/api';

export function PulseDashboard() {
  const { lang, setLang, t } = useI18n();
  // La sesión ya la tiene PKGD OS: el correo y el salir salen del store del OS,
  // no de Firebase. El resto del dashboard es idéntico al original.
  const user = useSessionStore((s) => s.user);
  // Mismo cierre de sesión que el riel del OS: invalida en el backend y limpia
  // el store (el layout /_app detecta token=null y manda a /login).
  const signOut = async () => {
    try {
      await authApi.logout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      forceLogout();
    }
  };
  const { meta, loading, granularity, a, b } = usePeriods();
  const [paidOn, setPaidOn] = useState(true);

  if (loading) return <div className="loading">{t('Loading…', 'Cargando…')}</div>;

  const aLabel = a ? labelOf({ granularity, id: a }, lang) : '—';
  const bLabel = b ? labelOf({ granularity, id: b }, lang) : '—';

  return (
    <>
      <header className="header">
        <div className="header-left">
          <div className="eyebrow">PKGD Group · {t('Comparative & Historical Dashboard', 'Dashboard Comparativo e Histórico')}</div>
          <h1>Quincenal <em>Pulse</em></h1>
          <div className="tagline">Built Right. Brought Right.</div>
        </div>
        <div className="header-right">
          <div className="period-pill">B · {bLabel}</div>
          <div className="vs-line">{t('vs', 'vs')} A · {aLabel}</div>
          <div className="lang-bar">
            <button className={`lang-btn ${lang === 'en' ? 'active' : ''}`} onClick={() => setLang('en')}>EN</button>
            <button className={`lang-btn ${lang === 'es' ? 'active' : ''}`} onClick={() => setLang('es')}>ES</button>
          </div>
          <div className="userbar" style={{ marginTop: 12, justifyContent: 'flex-end' }}>
            <span>{user?.email}</span>
            <button className="btn-logout" onClick={signOut}>{t('Sign out', 'Salir')}</button>
          </div>
        </div>
      </header>

      {meta && !meta.windsorConfigured && (
        <div className="banner warn">
          {t(
            '⚠ Windsor.ai not configured — no data. Set WINDSOR_API_KEY in backend/.env and run `npm run sync`.',
            '⚠ Windsor.ai sin configurar — sin datos. Pon WINDSOR_API_KEY en backend/.env y corre `npm run sync`.',
          )}
        </div>
      )}

      <PeriodSelector />

      {/* toggle del módulo activable Paid (doc §3) */}
      <div className="selector" style={{ marginTop: -16 }}>
        <div className="sel-group">
          <span className="sel-label">{t('Toggleable module', 'Módulo activable')}</span>
          <div className="sel-modes">
            <button className={`sel-mode ${paidOn ? 'active' : ''}`} onClick={() => setPaidOn((v) => !v)}>Paid {paidOn ? 'ON' : 'OFF'}</button>
          </div>
        </div>
        <span className="sel-tag">{t('Turn off for an "organic-only" cut.', 'Apágalo para un corte "solo orgánico".')}</span>
      </div>

      <Executive />
      <Web />
      <Paid enabled={paidOn} />
      <MetaAds enabled={paidOn} />
      <Instagram />
      <YouTube />
      <TikTok />
      <LinkedIn />
      <Provenance />

      <footer>
        <span>PKGD Group · Quincenal Pulse</span>
        <span>{meta?.dataRange ? `${t('Data', 'Datos')}: ${meta.dataRange.from} → ${meta.dataRange.to}` : ''}</span>
        <span>{meta?.lastSync ? `${t('Last sync', 'Última sincronización')}: ${new Date(meta.lastSync).toLocaleString()}` : t('No Windsor sync yet', 'Sin sincronización Windsor')}</span>
      </footer>
    </>
  );
}
