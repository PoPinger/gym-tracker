import { useLanguage } from '../i18n/LanguageContext';

// Full-screen branded loader, centred in the viewport (covers sidebar/topbar while loading)
export default function AppLoader() {
  const { t } = useLanguage();
  return (
    <div className="app-loader" role="status" aria-live="polite">
      <img className="app-loader-logo" src="/logo.png" alt="" />
      <div className="app-loader-name" data-text="GymTracker">Gym<span>Tracker</span></div>
      <span className="app-loader-text">{t('loading_app')}</span>
    </div>
  );
}
