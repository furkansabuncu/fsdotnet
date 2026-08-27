import { defineConfig } from 'vitest/config';
import { loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

/**
 * Varlıkların ve bağlantıların taşıyacağı yol öneki.
 *
 * GitHub Pages proje siteleri depo adının altında yayınlanıyor
 * (`/fsdotnet/`), kendi alan adı ya da kullanıcı sitesi ise kökte. İkisini
 * ayrı ayarlarda tutmak yerine tek kaynaktan — `VITE_SITE_URL`'in yolundan —
 * çıkarılıyor; böylece adres değişince önek kendiliğinden doğru oluyor.
 *
 * Değer `loadEnv` ile okunuyor, `process.env` ile değil: bu dosya da tip
 * denetiminden geçiyor ve `process` için yalnızca bunun uğruna `@types/node`
 * eklemek gerekirdi.
 */
function basePath(mode: string): string {
  const site = loadEnv(mode, '.', 'VITE_').VITE_SITE_URL;
  if (!site) return '/';
  try {
    const path = new URL(site).pathname.replace(/\/+$/, '');
    return path === '' ? '/' : `${path}/`;
  } catch {
    // Bozuk adres derlemeyi durdurmasın; kök varsayılır.
    return '/';
  }
}

export default defineConfig(({ mode }) => ({
  base: basePath(mode),

  /* Service worker'ın derleme zamanı sabiti. Asıl değeri `scripts/sw.mjs`
     yazıyor; buradaki yalnızca testler ve tip denetimi için — uygulama
     paketi bu sabite hiç dokunmadığı için çıktıya girmiyor. */
  define: { __SW_VERSION__: JSON.stringify('test') },
  plugins: [react(), tailwindcss()],
  server: {
    watch: {
      /*
       * `npm run test:coverage` bu klasöre ~40 HTML dosyası yazıyor. Vite
       * onları izlediğinde her dosya için tam sayfa yenilemesi tetikleniyor
       * ve dev sunucusu HMR kuyruğunda boğuluyor (500 döner).
       */
      ignored: ['**/coverage/**'],
    },
  },

  test: {
    // Araç mantığı saf TypeScript; DOM gerektiren component testleri dosya
    // başında `// @vitest-environment jsdom` ile kendi ortamını seçer.
    environment: 'node',
    // jest-dom eşleştiricileri ve testler arası DOM temizliği.
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
    /*
     * Varsayılan 5 sn, component testleri için coverage açıkken yetmiyor:
     * ilk render bütün kayıt defterini (23 araç tanımı ve ikonları) içe
     * aktarıyor ve enstrümantasyon altında bu tek başına ~9 sn sürebiliyor.
     * Saf mantık testleri milisaniyeler içinde bittiği için üst sınırı
     * yükseltmek onların geri bildirimini yavaşlatmıyor; CI makinesi bu
     * masrafı yerelden daha da pahalı ödüyor.
     */
    testTimeout: 30_000,
    coverage: {
      provider: 'v8',
      include: ['src/tools/**/*.ts', 'src/lint/**/*.ts'],
      exclude: [
        'src/tools/**/index.ts',
        'src/tools/types.ts',
        'src/tools/registry.ts',
        'src/tools/categories.ts',
      ],
      thresholds: { lines: 90, functions: 90, branches: 85, statements: 90 },
    },
  },
}));
