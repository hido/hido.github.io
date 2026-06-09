// Bodies of the <script is:inline> blocks in BaseLayout.astro, plus the
// helper that turns them into CSP hash sources. Imported by BOTH
// astro.config.mjs (to register the hashes in experimental.csp) and
// BaseLayout.astro (to render the scripts via set:html), so the rendered
// bytes and the hashed bytes can never drift apart.
import { createHash } from 'node:crypto';

// Theme init: resolve saved preference or OS hint BEFORE first paint
// so the page doesn't flash the opposite scheme. Runs synchronously
// because it sits in <head> and writes data-theme on <html>.
export const THEME_INIT = `(function () {
  try {
    var saved = localStorage.getItem('theme');
    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    var theme = saved === 'light' || saved === 'dark'
      ? saved
      : (prefersDark ? 'dark' : 'light');
    document.documentElement.dataset.theme = theme;
  } catch (e) {
    document.documentElement.dataset.theme = 'light';
  }
})();`;

// Google tag (gtag.js) bootstrap. The external gtag.js loader stays a plain
// <script async src> in BaseLayout and is allowlisted by host in the CSP.
export const GTAG_INIT = `window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', 'G-VFWBCZCM1D');`;

// Astro's csp `hashes` option expects "sha256-<base64>" without quotes.
export const cspHash = (src) =>
  'sha256-' + createHash('sha256').update(src, 'utf8').digest('base64');
