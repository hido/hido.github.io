// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://hido.github.io',
  integrations: [sitemap()],
  redirects: {
    '/talks': '/talks-and-media',
    '/press': '/talks-and-media',
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
