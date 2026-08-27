/**
 * Service worker'ı derler.
 *
 * Ayrı bir derleme adımı çünkü service worker uygulamanın modül grafiğinin
 * parçası değil: tarayıcı onu SABİT bir adresten, kendi başına indiriyor.
 * Vite'ın içerik özetli çıktısına karışamaz — adı `sw.js` kalmak zorunda.
 * Kapsamı da bulunduğu klasör olduğu için kökte durmak zorunda.
 *
 * Yeni bağımlılık yok: Vite'ın kendi derleme API'si kullanılıyor.
 */
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'vite';

const here = dirname(fileURLToPath(import.meta.url));
const web = join(here, '..');

/*
 * Sürüm damgası dakika hassasiyetinde. Her yayında değişmesi ŞART: önbellek
 * adı buradan geliyor ve `activate` yalnızca ad değişince eskisini siliyor.
 * Saniye eklemek bir şey kazandırmaz; yalnızca tarih ise aynı gün içindeki
 * ikinci yayını kaçırırdı.
 */
const version = new Date().toISOString().slice(0, 16).replace(/[-:T]/g, '');

await build({
  configFile: false,
  logLevel: 'warn',
  define: { __SW_VERSION__: JSON.stringify(version) },
  build: {
    outDir: join(web, 'dist'),
    // Uygulama derlemesinin çıktısı duruyor; bu adım yalnızca ekliyor.
    emptyOutDir: false,
    // IIFE: service worker bir modül olarak yüklenmiyor, düz betik.
    lib: { entry: join(web, 'src/pwa/sw.ts'), formats: ['iife'], name: 'sw', fileName: () => 'sw.js' },
    rollupOptions: { output: { entryFileNames: 'sw.js' } },
  },
});

console.log(`sw: ${version}`);
