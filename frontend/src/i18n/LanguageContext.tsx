import { createContext, useContext, useState, useCallback } from 'react';
import { translations } from './translations';
import type { Lang, TranslationMap } from './translations';

interface LanguageContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: keyof TranslationMap) => string;
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: 'pl',
  setLang: () => {},
  t: (key) => key as string,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    const stored = localStorage.getItem('gymtracker_lang');
    return (stored === 'en' || stored === 'pl') ? stored : 'pl';
  });

  const setLang = useCallback((l: Lang) => {
    localStorage.setItem('gymtracker_lang', l);
    setLangState(l);
  }, []);

  const t = useCallback((key: keyof TranslationMap): string => {
    return translations[lang][key] ?? key;
  }, [lang]);

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
