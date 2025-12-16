// @ts-check
import { defineConfig } from 'astro/config';

// Static build config for Reclaim hosting
// Server-only pages (login, dashboard, API routes) are excluded by build-static.js
export default defineConfig({
  // IMPORTANT: If you are hosting in a subfolder (e.g., domain.com/project-name),
  // uncomment the line below and set it to your folder name:
  // base: '/your-folder-name',
  
  output: 'static', // Static mode - no server needed
  publicDir: 'public',
  build: {
    assets: 'assets'
  }
});

