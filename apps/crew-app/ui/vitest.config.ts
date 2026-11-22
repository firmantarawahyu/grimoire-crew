import { fileURLToPath } from 'node:url';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // The real SDK only exists inside the Crew dashboard; tests use a stand-in.
      '@kirocrew/app-sdk': fileURLToPath(new URL('./test/stubs/app-sdk.ts', import.meta.url)),
    },
  },
  test: {
    include: ['test/**/*.test.{ts,tsx}'],
    environment: 'jsdom',
    setupFiles: ['test/setup.ts'],
    css: false,
  },
});
