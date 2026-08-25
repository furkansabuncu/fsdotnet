/**
 * sitemap.xml ve robots.txt üretir.
 *
 * Elle tutulmuyor çünkü 24 araç × 2 dil = 50 adres var ve yeni bir araç
 * eklendiğinde listeyi güncellemeyi unutmak sessiz bir kayıp: sayfa yayında
 * ama arama motoruna hiç bildirilmemiş oluyor.
 *
 * Kaynak, uygulamanın kendi listeleri — ayrı bir kopya YOK. Node 22 tipleri
 * sıyırarak çalıştırdığı için bu iki TypeScript modülü doğrudan içe
 * aktarılabiliyor; ikisinin de çalışma zamanı bağımlılığı yok (React ya da
 * lucide içe aktaran `registry.ts` buradan okunamazdı).
 *
 * `npm run build` bunu her seferinde yeniden çalıştırıyor, yani çıktı
 * kaynakla kayamaz.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { TOOL_IDS } from '../src/tools/types.ts';
import { LOCALES, absoluteUrl } from '../src/i18n/locale.ts';

const here = dirname(fileURLToPath(import.meta.url));
const publicDir = join(here, '..', 'public');

/* Taban adres: Cloudflare Pages'te ortam değişkeni olarak veriliyor. Yerelde
   yoksa varsayılan alt alan kullanılıyor — canonical etiketiyle aynı
   varsayılan (src/shared/Seo.tsx), ikisinin ayrışmaması için. */
const siteUrl = (process.env.VITE_SITE_URL ?? 'https://fsdev.pages.dev').replace(/\/+$/, '');

/** Dil öneki olmadan, sitede indekslenmesini istediğimiz her yol. */
const paths = ['/', ...TOOL_IDS.map((id) => `/t/${id}`)];

const escape = (value) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/*
 * Her adres, kendisi dâhil bütün dil karşılıklarını `xhtml:link` ile
 * listeliyor. Google karşılıklı bildirim bekliyor: tek yönlü hreflang sessizce
 * yok sayılır ve iki dil birbirinin kopyası sanılır.
 */
const entries = LOCALES.flatMap((locale) =>
  paths.map((path) => {
    const alternates = [
      ...LOCALES.map((alternate) => ({ lang: alternate, href: absoluteUrl(siteUrl, alternate, path) })),
      { lang: 'x-default', href: absoluteUrl(siteUrl, 'en', path) },
    ];

    return [
      '  <url>',
      `    <loc>${escape(absoluteUrl(siteUrl, locale, path))}</loc>`,
      ...alternates.map(
        (alternate) =>
          `    <xhtml:link rel="alternate" hreflang="${alternate.lang}" href="${escape(alternate.href)}" />`,
      ),
      // Ana sayfa katalog değiştikçe güncelleniyor; araç sayfaları daha durgun.
      `    <priority>${path === '/' ? '1.0' : '0.8'}</priority>`,
      '  </url>',
    ].join('\n');
  }),
);

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${entries.join('\n')}
</urlset>
`;

/* Hiçbir şey engellenmiyor: sitede gizli alan yok. `noindex` gereken tek
   sayfa 404 ve onu meta etiketi hallediyor — robots.txt ile engellenen bir
   sayfanın meta etiketi zaten okunamaz. */
const robots = `User-agent: *
Allow: /

Sitemap: ${siteUrl}/sitemap.xml
`;

mkdirSync(publicDir, { recursive: true });
writeFileSync(join(publicDir, 'sitemap.xml'), sitemap);
writeFileSync(join(publicDir, 'robots.txt'), robots);

console.log(`sitemap.xml: ${entries.length} adres · taban ${siteUrl}`);
