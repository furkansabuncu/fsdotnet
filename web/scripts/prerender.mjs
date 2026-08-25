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
import { LOCALES, localePath } from '../src/i18n/locale.ts';

const here = dirname(fileURLToPath(import.meta.url));
const web = join(here, '..');
const dist = join(web, 'dist');
const ssrDir = join(web, '.ssr');

const template = readFileSync(join(dist, 'index.html'), 'utf8');
const { render } = await import(pathToFileURL(join(ssrDir, 'entry-server.js')).href);

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

function hoistHeadTags(html) {
  const head = [];
  const body = html.replace(HEAD_TAG, (tag) => {
    head.push(tag);
    return '';
  });
  return { head: head.join('\n    '), body };
}

/** Dil öneki olmadan, ön-render edilecek her yol. */
const paths = ['/', ...TOOL_IDS.map((id) => `/t/${id}`)];

const routes = LOCALES.flatMap((locale) => paths.map((path) => localePath(locale, path)));

let written = 0;

for (const route of routes) {
  const { head, body } = hoistHeadTags(render(route));

  const html = template
    .replace('<div id="root"></div>', `<div id="root">${body}</div>`)
    .replace('</head>', `  ${head}\n  </head>`);

  /* Cloudflare Pages ve Netlify `/en/t/base64` isteğini
     `/en/t/base64/index.html` dosyasına eşliyor. `_redirects` kuralı yalnızca
     gerçek dosya bulunamayınca çalıştığı için bu dosyalar SPA yeniden
     yazımının önüne geçiyor — istenen de bu. */
  const dir = join(dist, route);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'index.html'), html);
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
const root = hoistHeadTags(render(localePath('en')));
writeFileSync(
  join(dist, 'index.html'),
  template
    .replace('<div id="root"></div>', `<div id="root">${root.body}</div>`)
    .replace('</head>', `  ${root.head}\n  </head>`),
);

// SSR paketi yalnızca bu adım için vardı; yayınlanacak çıktıya girmiyor.
rmSync(ssrDir, { recursive: true, force: true });

console.log(`ön-render: ${written} sayfa + kök`);
