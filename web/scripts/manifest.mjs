/**
 * Web manifestini üretir.
 *
 * `public/` altına ve `vite build`den ÖNCE yazılıyor: Vite, `index.html`
 * içindeki mutlak adresleri yalnızca o an VAR OLAN public dosyaları için
 * yol önekiyle yeniden yazıyor. Sonradan `dist/`e yazılan bir manifest,
 * proje sitesinde `/manifest.webmanifest` diye aranır ve 404 döner — ilk
 * denemede tam olarak bu oldu.
 *
 * Aynı sebeple `sitemap.xml` de public'e yazılıyor; ikisi de kaynak değil
 * üretilmiş dosya.
 */
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const publicDir = join(here, '..', 'public');

/* Yol öneki: GitHub Pages proje siteleri depo adının altında yayınlanıyor.
   Manifestin `scope` ve `start_url` alanları o öneki taşımazsa uygulama
   kökü yanlış yerde sanılır. Kaynak `vite.config.ts` ile aynı. */
const basePath = (() => {
  const site = process.env.VITE_SITE_URL;
  if (!site) return '/';

  try {
    const path = new URL(site).pathname.replace(/\/+$/, '');
    return path === '' ? '/' : `${path}/`;
  } catch {
    return '/';
  }
})();

const manifest = {
  name: 'fsdotnet — developer tools for the .NET ecosystem',
  short_name: 'fsdotnet',
  description: 'Oracle, .NET and Delphi tools that run in your browser.',
  id: basePath,
  start_url: basePath,
  scope: basePath,
  display: 'standalone',
  background_color: '#0a0a0a',
  theme_color: '#0a0a0a',

  /* Yalnızca SVG. Chrome'un "ana ekrana ekle" istemi 192 ve 512 piksellik
     PNG istiyor ve onları üretmek bir rasterleştirici — yani yeni bir
     bağımlılık — gerektiriyor. Asıl kazanç olan ÇEVRİMDIŞI çalışma bunu
     gerektirmiyor; eksik kalan yalnızca kurulum istemi. */
  icons: [{ src: `${basePath}favicon.svg`, sizes: 'any', type: 'image/svg+xml', purpose: 'any' }],
};

writeFileSync(join(publicDir, 'manifest.webmanifest'), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`manifest: ${basePath}`);
