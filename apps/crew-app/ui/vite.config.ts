import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

import { HOST_MODULES } from './host-modules.ts';

// The Crew dashboard lazy-imports `ui.entry` (`dist/index.mjs`) and renders its
// default export. Host modules stay external so React and the SDK are the
// host's single instances. The bundle is committed (Crew installs the app as a
// plain clone) and kept unminified so it stays reviewable; CI rebuilds it and
// fails on a diff.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    lib: {
      entry: 'src/index.tsx',
      formats: ['es'],
      fileName: () => 'index.mjs',
    },
    outDir: 'dist',
    emptyOutDir: true,
    minify: false,
    sourcemap: false,
    rolldownOptions: {
      external: [...HOST_MODULES],
    },
  },
});
