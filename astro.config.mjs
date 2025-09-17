// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  publicDir: 'public',
  build: {
    assets: 'assets'
  }
});
