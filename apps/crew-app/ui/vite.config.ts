import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vite';

import { HOST_MODULES } from './host-modules.ts';

/**
 * The unminified bundle starts each module with a `// <path>` comment. Paths
 * inside node_modules contain pnpm store folder names, which pnpm shortens
 * differently on Windows and Linux. Dropping those comment lines keeps the
 * committed bundle byte-identical on every machine.
 */
function stripDependencyPathComments(): Plugin {
  return {
    name: 'grimoire-strip-dependency-path-comments',
    apply: 'build',
    enforce: 'post',
    renderChunk(code) {
      return { code: code.replace(/^\/\/ (?:\.\.\/)*node_modules\/.*\r?\n/gm, ''), map: null };
    },
  };
}

// The Crew dashboard lazy-imports `ui.entry` (`dist/index.mjs`) and renders its
// default export. Host modules stay external so React and the SDK are the
// host's single instances. The bundle is committed (Crew installs the app as a
// plain clone) and kept unminified so it stays reviewable; CI rebuilds it and
// fails on a diff.
export default defineConfig({
  plugins: [react(), tailwindcss(), stripDependencyPathComments()],
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
