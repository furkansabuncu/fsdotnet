import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    // Araç mantığı saf TypeScript; DOM gerektiren component testleri dosya
    // başında `// @vitest-environment jsdom` ile kendi ortamını seçer.
    environment: 'node',
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
