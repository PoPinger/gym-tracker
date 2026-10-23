// Refresh button of the top bar: sends the offline queue, re-fetches the open page's data and checks for
// a new app version. A new version reloads the app once the queue is sent, unless something typed is not
// saved yet (then a hint asks to save first). Offline it only shows a short hint.
import { useEffect, useRef, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { flushAndWait } from '../offline/queue';
import { hasUnsaved, reloadPages } from '../hooks/useRefresh';
import { newVersionAvailable } from '../utils/appUpdate';

// The icon spins at least this long so the tap is visible
const MIN_SPIN_MS = 600;
const HINT_MS = 2500;

type Hint = 'offline' | 'save';

export default function RefreshButton() {
  const { t } = useLanguage();
  const [spinning, setSpinning] = useState(false);
  const [hint, setHint] = useState<Hint | null>(null);
  const hintTimer = useRef<number>(undefined);
  useEffect(() => () => window.clearTimeout(hintTimer.current), []);

  const showHint = (h: Hint) => {
    setHint(h);
    window.clearTimeout(hintTimer.current);
    hintTimer.current = window.setTimeout(() => setHint(null), HINT_MS);
  };

  const refresh = async () => {
    if (spinning) return;
    if (!navigator.onLine) { showHint('offline'); return; }
    setSpinning(true); setHint(null);
    const work = (async () => {
      await flushAndWait();
      // null: the network could not be reached
      const update = await newVersionAvailable().catch(() => null);
      if (update && !hasUnsaved()) return 'reload' as const;
      if (update !== null) await reloadPages();
      return update === null ? 'offline' as const : update ? 'save' as const : 'done' as const;
    })();
    const [result] = await Promise.all([work.catch(() => 'done' as const), new Promise(r => window.setTimeout(r, MIN_SPIN_MS))]);
    // Queued writes are kept in IndexedDB, so nothing is lost by the reload
    if (result === 'reload') { window.location.reload(); return; }
    setSpinning(false);
    if (result === 'offline' || result === 'save') showHint(result);
  };

  return (
    <span className="refresh-wrap">
      <button type="button" className={`hamburger refresh-btn${spinning ? ' spinning' : ''}`} onClick={refresh}
        aria-label={t('refresh_label')} title={t('refresh_label')} aria-busy={spinning}>
        <RefreshCw size={20} />
      </button>
      {hint && <span className="refresh-hint" role="status">{t(hint === 'offline' ? 'refresh_offline' : 'refresh_save_first')}</span>}
    </span>
  );
}
