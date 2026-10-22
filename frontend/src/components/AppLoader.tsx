import { useLanguage } from '../i18n/LanguageContext';
import Mascot from './mascot/Mascot';

// Full-screen branded loader, centred in the viewport (covers sidebar/topbar while loading)
export default function AppLoader() {
  const { t } = useLanguage();
  return (
    <div className="app-loader" role="status" aria-live="polite">
      <Mascot state="press" size={64} className="app-loader-mascot" />
      <div className="app-loader-logo"><img src="/icons/logo.png" alt="" /></div>
      <div className="app-loader-name" data-text="GymTracker">Gym<span>Tracker</span></div>
      <span className="app-loader-text">{t('loading_app')}</span>
    </div>
  );
}
