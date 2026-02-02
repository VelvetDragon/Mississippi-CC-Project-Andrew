// @ts-check
import { defineConfig } from 'astro/config';
import netlify from '@astrojs/netlify';

export default defineConfig({
  site: 'https://mississippi-cc-project.netlify.app/',
  output: 'server',
  adapter: netlify(),
  publicDir: 'public',
  build: {
    assets: 'assets',
  },
});