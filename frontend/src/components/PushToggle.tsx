// "Powiadomienia o przerwie" in the sidebar: per device; turning it on asks for notification permission.
// iPhone outside the home-screen app, blocked permission or an unsupported browser show a short hint.
import { useEffect, useState } from 'react';
import { BellRing } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { disablePush, enablePush, pushEnabled, pushSupport } from '../utils/push';

type Hint = 'ios' | 'unsupported' | 'denied' | 'error';

const HINT_KEY = { ios: 'push_hint_ios', unsupported: 'push_hint_unsupported', denied: 'push_hint_denied', error: 'push_hint_error' } as const;

export default function PushToggle() {
  const { t } = useLanguage();
  const [support] = useState(pushSupport);
  const [on, setOn] = useState(false);
  const [busy, setBusy] = useState(false);
  const [hint, setHint] = useState<Hint | null>(() =>
    support === 'ios-home-screen' ? 'ios' : support === 'unsupported' ? 'unsupported'
      : Notification.permission === 'denied' ? 'denied' : null);

  useEffect(() => { void pushEnabled().then(setOn); }, []);

  const toggle = async () => {
    if (busy || support !== 'ok') return;
    setBusy(true);
    if (on) {
      await disablePush();
      setOn(false); setHint(null);
    } else {
      const r = await enablePush();
      setOn(r === 'on');
      setHint(r === 'on' ? null : r);
    }
    setBusy(false);
  };

  return (
    <div className="push-toggle">
      <button type="button" role="switch" aria-checked={on} disabled={support !== 'ok' || busy}
        className={`wl-switch push${on ? ' on' : ''}`} onClick={toggle}>
        <BellRing size={16} className="push-icon" />
        <span className="push-label">{t('push_toggle')}</span>
        <span className="wl-switch-track"><span /></span>
      </button>
      {hint && <p className="push-hint">{t(HINT_KEY[hint])}</p>}
    </div>
  );
}
