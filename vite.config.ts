import preact from '@preact/preset-vite';
import { defineConfig } from 'vite';

// Dev/demo app for the standalone player. The package itself is consumed by Astro
// in Phase 5; this server is just for local development and verification.
export default defineConfig({
  root: 'dev',
  plugins: [preact()],
  server: { port: 5173 },
});
