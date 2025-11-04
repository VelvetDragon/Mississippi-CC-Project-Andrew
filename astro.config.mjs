// @ts-check
import { defineConfig } from 'astro/config';
import netlify from '@astrojs/netlify';

// https://astro.build/config
export default defineConfig({
  output: 'server', // Server mode for API routes
  adapter: netlify(),
  publicDir: 'public',
  build: {
    assets: 'assets'
  }
});
