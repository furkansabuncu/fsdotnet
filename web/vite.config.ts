import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
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
    coverage: {
      provider: 'v8',
      include: ['src/tools/**/*.ts'],
      exclude: [
        'src/tools/**/index.ts',
        'src/tools/types.ts',
        'src/tools/registry.ts',
        'src/tools/categories.ts',
      ],
      thresholds: { lines: 90, functions: 90, branches: 85, statements: 90 },
    },
  },
});
