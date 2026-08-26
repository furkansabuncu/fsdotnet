/**
 * Her rotayı statik HTML'e basar.
 *
 * Neden gerekli: paylaşım tarayıcıları (LinkedIn, Slack, X) ve pek çok
 * arama/LLM tarayıcısı JavaScript ÇALIŞTIRMAZ. Meta etiketleri React
 * tarafından üretildiği için, ön-render olmadan onlar boş bir kabuk görüyor
 * — yani og kartları hiç görünmüyor ve her adres aynı (boş) sayfa sanılıyor.
 *
 * Google JS çalıştırır, o yüzden bu adım Google için bir ek; ötekiler için
 * ise tek yol.
 *
 * Akış: istemci derlemesinin `index.html`'i şablon olarak alınıyor, SSR
 * paketi her adresi render ediyor, çıkan işaretleme `#root` içine gömülüyor
 * ve React'in hoist ettiği head etiketleri `<head>`e taşınıyor.
 */
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { TOOL_IDS } from '../src/tools/types.ts';
import { LOCALES, localePath, splitLocale } from '../src/i18n/locale.ts';

const here = dirname(fileURLToPath(import.meta.url));
const web = join(here, '..');
const dist = join(web, 'dist');
const ssrDir = join(web, '.ssr');

const template = readFileSync(join(dist, 'index.html'), 'utf8');
const { render } = await import(pathToFileURL(join(ssrDir, 'entry-server.js')).href);

/*
 * Yol öneki iki farklı yerde farklı biçimde gerekiyor ve karıştırmak sessiz
 * hata üretir:
 *
 *   - `render()`e verilen adres önek TAŞIMALI, çünkü SSR router'ının
 *     `basename`i var ve gelen konumdan onu soyuyor.
 *   - Dosya yolu önek TAŞIMAMALI, çünkü barındırıcı `dist`in kendisini
 *     zaten o önekin altına eşliyor. Klasöre de eklersek adres
 *     `/fsdotnet/fsdotnet/tr` olur.
 *
 * Kaynak `vite.config.ts` ile aynı: `VITE_SITE_URL`'in yolu.
 */
const basePath = (() => {
  const site = process.env.VITE_SITE_URL;
  if (!site) return '';
  try {
    return new URL(site).pathname.replace(/\/+$/, '');
  } catch {
    return '';
  }
})();

/**
 * React 19, component içinde render edilen `<title>`, `<meta>` ve `<link>`
 * etiketlerini tarayıcıda `<head>`e taşıyor. `renderToString`in bir belge
 * kabuğu olmadığı için bunlar gövde işaretlemesinin içinde kalıyor —
 * tarayıcılar orada da okur ama arama motorları `<head>` bekliyor. Bu yüzden
 * çıkarılıp yukarı alınıyorlar.
 *
 * Kalıp dar tutuldu: yalnızca `Seo.tsx` ve `NotFoundPage.tsx`'in ürettiği
 * etiketler eşleşiyor, gövdedeki gerçek içerik değil.
 */
const HEAD_TAG = /<(title|meta|link)\b[^>]*?(?:\/>|>(?:[^<]*<\/title>)?)/g;

/**
 * Sayfanın dilini KABUĞA yazar.
 *
 * İstemci bunu bir effect'te ayarlıyor, yani JavaScript çalışmadan önce
 * Türkçe sayfa da `lang="en"` diyor. Paylaşım tarayıcıları ve ekran
 * okuyucular tam olarak o anı görüyor.
 */
function withLang(html, route) {
  const locale = splitLocale(route).locale ?? 'en';
  return html.replace('<html lang="en">', `<html lang="${locale}">`);
}

function hoistHeadTags(html) {
  const head = [];
  const body = html.replace(HEAD_TAG, (tag) => {
    /*
     * `data-ssr-head` şart: React bu etiketleri KENDİ ürettiği saymıyor
     * (onları beklediği konumda bulmuyor) ve mount olurken kendi kopyalarını
     * ekliyor. İşaretlenmeseler `main.tsx` hangilerini kaldıracağını bilemez
     * ve sayfada iki başlık, iki açıklama, İKİ CANONICAL kalırdı — sonuncusu
     * arama motoruna çelişkili sinyal vermek demek.
     */
    head.push(tag.replace(/^<(title|meta|link)\b/, '<$1 data-ssr-head'));
    return '';
  });
  return { head: head.join('\n    '), body };
}

/** Dil öneki olmadan, ön-render edilecek her yol. */
const paths = ['/', ...TOOL_IDS.map((id) => `/t/${id}`)];

const routes = LOCALES.flatMap((locale) => paths.map((path) => localePath(locale, path)));

/**
 * Bir rotayı tam belgeye çevirir.
 *
 * Üç çağrı yeri var (rotalar, kök, 404) ve üçü de aynı üç adımı yapıyordu:
 * gövdeyi göm, head etiketlerini yukarı taşı, dili yaz. Üç kopya tutmanın
 * bedeli hemen görüldü — dil yalnızca birine eklenince Türkçe sayfalar
 * `lang="en"` demeye devam etti.
 */
function page(route) {
  const { head, body } = hoistHeadTags(render(basePath + route));
  return withLang(
    template
      .replace('<div id="root"></div>', `<div id="root">${body}</div>`)
      .replace('</head>', `  ${head}\n  </head>`),
    route,
  );
}

let written = 0;

for (const route of routes) {
  /* Barındırıcı `/en/t/base64` isteğini `/en/t/base64/index.html` dosyasına
     eşliyor, yani her rota gerçek bir dosya — hiçbir yeniden yazma
     kuralına ihtiyaç duymuyor. */
  const dir = join(dist, route);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'index.html'), page(route));
  written += 1;
}

/*
 * Kök adres.
 *
 * `/` bir yönlendirme rotası, yani render edildiğinde hiçbir şey basmıyor —
 * ama paylaşılması en olası adres tam olarak o. Bu yüzden kök şablona
 * İngilizce ana sayfanın çıktısı yazılıyor; canonical `/en`'i gösterdiği
 * için arama motoru bunu kopya saymıyor.
 *
 * Aynı dosya SPA yedeği olarak da kullanılıyor: eşleşmeyen bir adres önce bu
 * işaretlemeyi gösterip hemen ardından React tarafından değiştiriliyor. Bunu
 * boş bir kabukla değiştirmek, kök adresi paylaşılamaz kılardı.
 */
const root = hoistHeadTags(render(basePath + localePath('en')));
writeFileSync(
  join(dist, 'index.html'),
  template
    .replace('<div id="root"></div>', `<div id="root">${root.body}</div>`)
    .replace('</head>', `  ${root.head}\n  </head>`),
);

/*
 * Bulunamayan adresler.
 *
 * Eskiden bu iş `_redirects` içindeki `/*  /index.html  200` kuralına aitti.
 * Cloudflare artık o kuralı SONSUZ DÖNGÜ sayıp yok sayıyor — derleme
 * günlüğünde "Parsed 0 valid redirect rules" satırı tam olarak buydu, yani
 * kural aylarca orada durup hiçbir şey yapmayabilirdi.
 *
 * `404.html` hem Cloudflare Pages'te hem Netlify'da desteklenen yol ve
 * aslında daha doğrusu: ön-render sonrası GERÇEK sayfaların hepsi birer
 * dosya, dolayısıyla 200 dönüyorlar. Geriye kalan yalnızca gerçekten var
 * olmayan adresler ve onların 404 dönmesi gerekiyor — yeniden yazma kuralı
 * onlara da 200 verirdi, ki bu arama motoruna yalan söylemek olurdu.
 */
const notFound = hoistHeadTags(render(basePath + localePath('en', '/__not-found__')));
writeFileSync(
  join(dist, '404.html'),
  template
    .replace('<div id="root"></div>', `<div id="root">${notFound.body}</div>`)
    .replace('</head>', `  ${notFound.head}\n  </head>`),
);

/* GitHub Pages çıktıyı varsayılan olarak Jekyll ile işliyor ve alt çizgiyle
   başlayan dosya/klasörleri atıyor. Bu işaret dosyası onu kapatıyor —
   olmadığında sorun ileride bir varlık sessizce kaybolduğunda anlaşılırdı. */
writeFileSync(join(dist, ".nojekyll"), "");

// SSR paketi yalnızca bu adım için vardı; yayınlanacak çıktıya girmiyor.
rmSync(ssrDir, { recursive: true, force: true });

console.log(`ön-render: ${written} sayfa + kök + 404`);
