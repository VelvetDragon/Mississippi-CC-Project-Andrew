// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  output: 'server', // Server mode for API routes
  publicDir: 'public',
  build: {
    assets: 'assets'
  }
});
