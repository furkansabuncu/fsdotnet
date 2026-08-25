import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { en, type Dictionary } from './en';
import { tr } from './tr';

export type Locale = 'en' | 'tr';

export const LOCALES: readonly Locale[] = ['en', 'tr'];

const DICTIONARIES: Record<Locale, Dictionary> = { en, tr };

const STORAGE_KEY = 'fsdev.locale';

function initialLocale(): Locale {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'en' || stored === 'tr') return stored;
  // Tarayıcı dili Türkçe ise Türkçe aç; aksi hâlde İngilizce varsayılan.
  return navigator.language.toLowerCase().startsWith('tr') ? 'tr' : 'en';
}

interface I18nValue {
  /** Aktif sözlük. Kullanımı: t.home.subtitle, t.palette.count(3) */
  t: Dictionary;
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>(initialLocale);
  const t = DICTIONARIES[locale];

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, locale);
    // <html lang> ekran okuyucunun telaffuzunu ve tarayıcının çeviri
    // önerisini belirler; başlık da sekmede görünür.
    document.documentElement.lang = t.htmlLang;
    document.title = t.title;
  }, [locale, t]);

  /* Nesne her render'da yeniden kurulursa context'i tüketen HER component
     yeniden render olur — bu sağlayıcı ağacın kökünde olduğu için "her
     component" demek. Yalnızca dil değiştiğinde yeni bir değer üretiyoruz. */
  const value = useMemo(() => ({ t, locale, setLocale }), [t, locale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const value = useContext(I18nContext);
  if (!value) throw new Error('useI18n must be used inside <I18nProvider>');
  return value;
}
