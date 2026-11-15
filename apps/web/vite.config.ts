import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // The browser only ever talks to Vite (localhost:5173), which forwards
    // /api to Nest. Same origin as far as the browser knows, so the API
    // doesn't need CORS. API_URL overrides where Nest is.
    proxy: {
      '/api': process.env.API_URL ?? 'http://localhost:3000',
    },
  },
});
