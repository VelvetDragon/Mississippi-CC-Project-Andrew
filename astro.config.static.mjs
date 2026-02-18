// @ts-check
import { defineConfig } from 'astro/config';

// Static build config for Reclaim hosting
// Server-only pages (login, dashboard, API routes) are excluded by build-static.js
export default defineConfig({
  site: 'https://mscommunitycookbooks.usmcdh.org/', // TODO: Replace with your actual Reclaim Hosting URL
  output: 'static', // Static mode - no server needed
  publicDir: 'public',
  build: {
    assets: 'assets'
  }
});

