// Loading state of a page. The very first load of the app (startup, auth check, server wake-up) shows the
// full-screen Kulka loader; every later page load inside the app shows skeleton cards in place of content.
import { useEffect, useState } from 'react';
import AppLoader from './AppLoader';
import { useLanguage } from '../i18n/LanguageContext';

let appLoaded = false;

export default function PageLoader({ cards = 3 }: { cards?: number }) {
  const [first] = useState(() => !appLoaded);
  // Done once the first loader goes away (its page has its data)
  useEffect(() => () => { appLoaded = true; }, []);
  if (first) return <AppLoader />;
  return <PageSkeleton cards={cards} />;
}

export function PageSkeleton({ cards = 3 }: { cards?: number }) {
  const { t } = useLanguage();
  return (
    <div className="skel-page" role="status" aria-live="polite" aria-label={t('loading_app')}>
      <div className="skel skel-title" />
      <div className="skel skel-sub" />
      {Array.from({ length: cards }, (_, i) => (
        <div key={i} className="skel-card">
          <div className="skel skel-line w60" />
          <div className="skel skel-line w80" />
          <div className="skel skel-line w40" />
        </div>
      ))}
    </div>
  );
}
