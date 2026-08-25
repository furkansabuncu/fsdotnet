import { LOCALES, absoluteUrl, type Locale } from '../i18n/locale';

/**
 * Sayfaya özel `<head>` etiketleri.
 *
 * React 19 component içinde render edilen `<title>`, `<meta>` ve `<link>`
 * etiketlerini kendisi `<head>`e taşıyor — react-helmet benzeri bir
 * kütüphaneye gerek yok. Etiketler EFFECT'te değil, bildirimsel olarak
 * yazılıyor; sebebi ileride eklenecek ön-render: `renderToString` effect
 * çalıştırmaz ama hoist edilen bu etiketleri çıktıya basar.
 *
 * Bu yüzden `index.html` artık sayfaya özel hiçbir meta taşımıyor — iki
 * sahip olsaydı head'de aynı etiketten iki tane olurdu ve tarayıcılar
 * ilkini alırdı, yani her sayfa aynı açıklamayı gösterirdi.
 */

const SITE_NAME = 'fsdev';

/**
 * Mutlak adresler canonical, hreflang ve og:url için şart — göreli adres
 * kabul edilmiyor. Taban derleme zamanında geliyor; verilmezse Pages'in
 * varsayılan alt alanı kullanılıyor.
 */
export const SITE_URL =
  (import.meta.env.VITE_SITE_URL as string | undefined)?.replace(/\/+$/, '') ??
  'https://fsdev.pages.dev';

interface SeoProps {
  /** Site adı eklenmemiş hâli — "Base64" gibi. */
  title: string;
  description: string;
  /** Dil öneki OLMADAN yol: `/` ya da `/t/base64`. */
  path: string;
  locale: Locale;
}

export default function Seo({ title, description, path, locale }: SeoProps) {
  const canonical = absoluteUrl(SITE_URL, locale, path);

  /* Kart dili sayfayla eşleşiyor: başlık Türkçe çıkıp görsel İngilizce
     kalırsa paylaşım yamalı görünüyor. Adres MUTLAK olmak zorunda — göreli
     bir yol paylaşım tarayıcıları tarafından çözülmüyor.
     Kaynağı: scripts/og/index.html */
  const image = `${SITE_URL}${locale === 'tr' ? '/og-tr.png' : '/og.png'}`;

  return (
    <>
      <title>{`${title} · ${SITE_NAME}`}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonical} />

      {/* Her dil ötekini işaret ediyor; `x-default` dil seçmemiş ziyaretçi
          için. Google karşılıklı bağlantı bekliyor — tek yönlü hreflang
          sessizce yok sayılıyor. */}
      {LOCALES.map((alternate) => (
        <link
          key={alternate}
          rel="alternate"
          hrefLang={alternate}
          href={absoluteUrl(SITE_URL, alternate, path)}
        />
      ))}
      <link rel="alternate" hrefLang="x-default" href={absoluteUrl(SITE_URL, 'en', path)} />

      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content={locale === 'tr' ? 'tr_TR' : 'en_US'} />
      <meta property="og:url" content={canonical} />
      <meta property="og:title" content={`${title} · ${SITE_NAME}`} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={`${SITE_NAME} — ${title}`} />

      {/* `summary_large_image` görselsiz beyan edilirse çıplak bir link
          çıkıyor; etiket ancak görsel varken doğru. */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={`${title} · ${SITE_NAME}`} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
    </>
  );
}
