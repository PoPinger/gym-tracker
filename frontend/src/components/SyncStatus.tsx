// Small sync pill: offline / syncing / synced, or a warning when the server rejected queued writes.
// The warning opens a sheet listing them, each with "try again" and "discard"; nothing is dropped silently.
import { useEffect, useState, useSyncExternalStore } from 'react';
import { AlertTriangle, Check, CloudOff, RefreshCw, X } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import type { TranslationMap } from '../i18n/translations';
import { discardFailed, flush, getSyncState, retryFailed, subscribeSync, type Op } from '../offline/queue';
import { plural } from '../utils/plural';

const KIND_KEY: Record<Op['kind'], keyof TranslationMap> = {
  createDay: 'sync_kind_createDay', saveSets: 'sync_kind_saveSets', completeDay: 'sync_kind_completeDay',
  note: 'sync_kind_note', weight: 'sync_kind_weight',
};

export default function SyncStatus() {
  const { t, lang } = useLanguage();
  const s = useSyncExternalStore(subscribeSync, getSyncState);
  const [open, setOpen] = useState(false);
  const failed = s.failed.length;

  // Mounted after login too: resumes a queue paused by an expired session
  useEffect(() => { flush(); }, []);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  let pill = null;
  if (failed) {
    const label = plural(failed, t('sync_failed_1'), t('sync_failed_other'), t('sync_failed_other')).replace('{n}', String(failed));
    pill = <button type="button" className="sync-pill failed" onClick={() => setOpen(true)}><AlertTriangle size={13} />{label}</button>;
  } else if (s.syncing) {
    pill = <span className="sync-pill syncing" role="status"><RefreshCw size={13} />{t('sync_syncing')}</span>;
  } else if (!s.online) {
    pill = <span className="sync-pill offline" role="status"><CloudOff size={13} />{s.pending ? t('sync_offline_saved') : t('sync_offline')}</span>;
  } else if (s.justSynced) {
    pill = <span className="sync-pill synced" role="status"><Check size={13} strokeWidth={3} />{t('sync_synced')}</span>;
  }

  // The sheet closes with its last entry
  const act = (fn: (seq: number) => Promise<void>, seq: number) => { if (failed === 1) setOpen(false); void fn(seq); };

  const fmt = (iso: string) => new Date(iso).toLocaleString(lang === 'en' ? 'en-US' : 'pl-PL',
    { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

  return (
    <>
      {pill}
      {open && failed > 0 && (
        <div className="sheet-overlay" onClick={() => setOpen(false)}>
          <div className="sheet" role="dialog" aria-modal="true" aria-labelledby="sync-title" onClick={e => e.stopPropagation()}>
            <div className="sheet-grip" />
            <div className="sheet-head">
              <span className="sync-sheet-icon"><AlertTriangle size={18} /></span>
              <div>
                <h2 id="sync-title">{t('sync_failed_title')}</h2>
                <p>{t('sync_failed_body')}</p>
              </div>
              <button type="button" className="sheet-close" aria-label={t('sync_close')} onClick={() => setOpen(false)}><X size={18} /></button>
            </div>
            <ul className="sync-list">
              {s.failed.map(r => (
                <li key={r.seq} className="sync-item">
                  <div className="sync-item-text">
                    <b>{t(KIND_KEY[r.op.kind])}</b>
                    <span>{r.label}</span>
                    <small>{fmt(r.createdAt)}</small>
                  </div>
                  <div className="sync-item-actions">
                    <button type="button" className="btn btn-outline btn-sm btn-danger-outline" onClick={() => act(discardFailed, r.seq!)}>{t('sync_discard')}</button>
                    <button type="button" className="btn btn-primary btn-sm" onClick={() => act(retryFailed, r.seq!)}>{t('sync_retry')}</button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
