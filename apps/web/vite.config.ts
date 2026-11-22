import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// The Mode A server listens on PORT (default 8787); see apps/server.
const SERVER_URL = 'http://localhost:8787';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': SERVER_URL,
    },
  },
});
