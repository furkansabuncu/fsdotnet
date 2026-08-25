import { createContext, useContext, useEffect, useMemo, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { en, type Dictionary } from './en';
import { tr } from './tr';
import { LOCALE_STORAGE_KEY, swapLocale, type Locale } from './locale';

const DICTIONARIES: Record<Locale, Dictionary> = { en, tr };

interface I18nValue {
  /** Aktif sözlük. Kullanımı: t.home.subtitle, t.palette.count(3) */
  t: Dictionary;
  locale: Locale;
  /** Aynı sayfada kalıp dili değiştirir — bir gezinme, bir state güncellemesi değil. */
  setLocale: (locale: Locale) => void;
}

const I18nContext = createContext<I18nValue | null>(null);

/**
 * Dil ARTIK ADRESTEN geliyor, kendi state'inden değil.
 *
 * Bu sağlayıcı bir doğruluk kaynağı tutmuyor; rotanın `:locale` parçasını
 * sözlüğe çeviriyor. Dil değiştirmek de bir gezinme: geri düğmesi çalışıyor,
 * adres paylaşılabiliyor ve arama motoru iki dili iki ayrı sayfa olarak
 * görüyor.
 */
export function I18nProvider({ locale, children }: { locale: Locale; children: ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const t = DICTIONARIES[locale];

  useEffect(() => {
    /* Tercih hatırlanıyor ama artık yalnızca ADRESTE DİL YOKKEN kullanılıyor
       (`/` ya da eski `/t/...` bağlantıları). Adres bir dil taşıyorsa o kazanır. */
    localStorage.setItem(LOCALE_STORAGE_KEY, locale);

    /* <html lang> ekran okuyucunun telaffuzunu ve tarayıcının çeviri önerisini
       belirliyor. Bildirimsel olarak yazılamıyor — React 19 <title> ve <meta>
       etiketlerini head'e taşıyor ama <html> özniteliğine dokunamıyor. */
    document.documentElement.lang = t.htmlLang;
  }, [locale, t]);

  /* Nesne her render'da yeniden kurulursa context'i tüketen HER component
     yeniden render olur — bu sağlayıcı ağacın kökünde olduğu için "her
     component" demek. */
  const value = useMemo(
    () => ({
      t,
      locale,
      setLocale: (next: Locale) =>
        navigate(`${swapLocale(location.pathname, next)}${location.search}${location.hash}`),
    }),
    [t, locale, navigate, location.pathname, location.search, location.hash],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const value = useContext(I18nContext);
  if (!value) throw new Error('useI18n must be used inside <I18nProvider>');
  return value;
}

/**
 * Dil önekli bir yol kurar: `path('/t/base64')` → `/tr/t/base64`.
 *
 * Her `<Link>` bunu kullanıyor. Öneki elle yazmak yerine tek bir yerden
 * geçirmenin sebebi: sonradan eklenen bir bağlantının öneki unutması, sessizce
 * kullanıcıyı dilsiz adrese atıp yönlendirme turu başlatırdı.
 */
export function useLocalePath(): (rest: string) => string {
  const { locale } = useI18n();
  return (rest: string) => {
    // Çapa (`/#dotnet`) yolun parçası değil; önek çapadan ÖNCE gelmeli.
    const [path = '/', hash] = rest.split('#');
    const prefixed = path === '/' || path === '' ? `/${locale}` : `/${locale}${path}`;
    return hash === undefined ? prefixed : `${prefixed}#${hash}`;
  };
}
