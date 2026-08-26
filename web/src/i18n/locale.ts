/**
 * Dil, adresin BİR PARÇASI — localStorage'da değil.
 *
 * Neden: `localStorage` bir tarayıcı tercihidir, arama motoru onu göremez.
 * Dil adreste olmadığı sürece Google sitenin yalnızca tek dilini tarar ve
 * Türkçe içerik hiç indekslenmez. Aynı sorunun ikinci yüzü paylaşımdır:
 * Türkçe bir sayfanın adresini gönderdiğinizde karşı taraf İngilizce görür.
 *
 * localStorage tamamen gitmiyor — ama artık yalnızca ADRESTE DİL YOKKEN
 * (`/` ya da eski `/t/...` bağlantıları) hangi dile gidileceğini seçmek için
 * okunuyor. Adres bir dil taşıyorsa o kazanır.
 */

export type Locale = 'en' | 'tr';

export const LOCALES: readonly Locale[] = ['en', 'tr'];

/** Adreste dil yokken ve tarayıcı da ipucu vermezken kullanılan dil. */
export const DEFAULT_LOCALE: Locale = 'en';

export const LOCALE_STORAGE_KEY = 'fsdotnet.locale';

export function isLocale(value: string | undefined): value is Locale {
  return value === 'en' || value === 'tr';
}

/**
 * Adreste dil yokken hangi dile gidileceğini seçer.
 *
 * Sıra: daha önce seçilmiş dil → tarayıcı dili → İngilizce. Tarayıcı
 * `tr-TR`, `tr-CY` gibi bölge ekleri döndürebildiği için ön ek karşılaştırılıyor.
 */
export function detectLocale(stored: string | null, languages: readonly string[]): Locale {
  if (isLocale(stored ?? undefined)) return stored as Locale;

  for (const language of languages) {
    const tag = language.toLowerCase();
    for (const locale of LOCALES) {
      if (tag === locale || tag.startsWith(`${locale}-`)) return locale;
    }
  }

  return DEFAULT_LOCALE;
}

/** Yoldan dil önekini ayırır. `/tr/t/base64` → `{ locale: 'tr', rest: '/t/base64' }` */
export function splitLocale(pathname: string): { locale: Locale | null; rest: string } {
  const match = /^\/([^/]+)(\/.*)?$/.exec(pathname);
  const head = match?.[1];
  if (!isLocale(head)) return { locale: null, rest: pathname };
  return { locale: head, rest: match?.[2] ?? '/' };
}

/**
 * Dil önekli yol kurar. `localePath('tr', '/t/base64')` → `/tr/t/base64`
 *
 * Kök için `/tr/` değil `/tr` üretiliyor: sondaki bölü çizgisi aynı sayfanın
 * ikinci bir adresi olur ve canonical ile sitemap'i çelişkiye düşürür.
 */
export function localePath(locale: Locale, rest = '/'): string {
  const path = rest.startsWith('/') ? rest : `/${rest}`;
  return path === '/' ? `/${locale}` : `/${locale}${path}`;
}

/** Aynı sayfanın öteki dildeki adresi — dil değiştirici bunu kullanıyor. */
export function swapLocale(pathname: string, next: Locale): string {
  return localePath(next, splitLocale(pathname).rest);
}

/**
 * Mutlak adres — canonical, hreflang, og:url ve sitemap için.
 *
 * Taban adres derleme zamanında `VITE_SITE_URL` ile geliyor. Yanlış ya da
 * eksik bir taban, canonical etiketini sessizce başka bir siteye
 * yönlendirebileceği için sondaki bölü çizgileri kırpılıyor.
 *
 * 🔴 Yol SONDA bölü çizgisi taşır, `localePath`in aksine. Sebebi ölçüldü:
 * GitHub Pages her dizin adresini çizgili hâline **301 ile yönlendiriyor**
 * (`/en/t/base64` → `/en/t/base64/`). Çizgisiz yazarsak canonical'ın
 * gösterdiği adres ile gerçekten 200 dönen adres farklı olur — yani
 * canonical'ın çözmesi gereken belirsizliği canonical'ın kendisi üretir,
 * ve sitemap'teki her satır bir yönlendirmeye çarpar.
 *
 * İç bağlantılar `localePath`i kullanmaya devam ediyor: router iki biçimi
 * de eşliyor ve gezinme sırasında yönlendirme yok.
 */
export function absoluteUrl(siteUrl: string, locale: Locale, rest = '/'): string {
  return `${siteUrl.replace(/\/+$/, '')}${localePath(locale, rest)}/`;
}
