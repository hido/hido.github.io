// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import { THEME_INIT, GTAG_INIT, cspHash } from './src/security/inline-scripts.mjs';

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
  experimental: {
    // Build-time CSP: Astro hashes every processed inline script/style and
    // injects a per-page <meta http-equiv="Content-Security-Policy">, which
    // lets us drop 'unsafe-inline' entirely (GitHub Pages can't set HTTP
    // headers). Not applied in `astro dev` — use build+preview to test.
    // Renames to `security.csp` on the Astro 6 upgrade.
    csp: {
      algorithm: 'SHA-256',
      // Directives other than script-src / style-src, which Astro manages.
      // frame-ancestors / report-uri can't be delivered via <meta> — accepted
      // limitation for a static GitHub Pages site.
      directives: [
        "default-src 'none'",
        "img-src 'self' data: https://www.google-analytics.com https://www.googletagmanager.com",
        "connect-src 'self' https://www.google-analytics.com https://*.analytics.google.com https://www.googletagmanager.com https://*.g.doubleclick.net",
        "font-src 'self' data:",
        "frame-src 'none'",
        "worker-src 'self'",
        "manifest-src 'self'",
        "media-src 'none'",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        'upgrade-insecure-requests',
      ],
      scriptDirective: {
        // GA4: gtag.js loader + region routing.
        resources: [
          "'self'",
          'https://www.googletagmanager.com',
          'https://www.google-analytics.com',
        ],
        // The two is:inline scripts in BaseLayout aren't auto-hashed by Astro;
        // their bodies live in src/security/inline-scripts.mjs so these hashes
        // always match what BaseLayout renders.
        hashes: [cspHash(THEME_INIT), cspHash(GTAG_INIT)],
      },
      styleDirective: {
        resources: ["'self'"],
      },
    },
  },
});
