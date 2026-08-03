import { PROVENANCE_LABELS, CHANNEL_LABELS, type Channel } from '@/pulse/shared';
import { api } from '../lib/api';
import { useAsync } from '../lib/hooks';
import { useI18n } from '../lib/i18n';
import { Collapsible } from '../components/Collapsible';

/** 7 · Data Provenance — transparencia del estado de cada fuente (doc §3.9). */
export function Provenance() {
  const { lang, t } = useI18n();
  const { data } = useAsync(() => api.provenance(), []);
  return (
    <Collapsible num="07" title={t('Data Provenance', 'Procedencia de Datos')} meta={t('source status', 'estado por fuente')}>
      <div className="card" style={{ padding: 0 }}>
        <table>
          <thead>
            <tr>
              <th>{t('Source', 'Fuente')}</th>
              <th>{t('Status', 'Estado')}</th>
              <th>{t('Last date', 'Última fecha')}</th>
              <th>{t('Note', 'Nota')}</th>
            </tr>
          </thead>
          <tbody>
            {(data ?? []).map((r) => (
              <tr key={r.channel}>
                <td>{CHANNEL_LABELS[r.channel as Channel] ?? r.channel}</td>
                <td><span className={`prov-badge prov-${r.status}`}>{PROVENANCE_LABELS[r.status][lang]}</span></td>
                <td>{r.lastDate ?? '—'}</td>
                <td style={{ whiteSpace: 'normal' }}>{r.note[lang]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Collapsible>
  );
}
