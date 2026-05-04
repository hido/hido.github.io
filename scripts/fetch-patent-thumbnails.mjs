// One-shot helper: walk src/content/publications/, find patent entries
// that have a Google Patents URL, scrape the front-page representative
// drawing, save it to public/thumbnails/, and write a `thumbnail:` line
// into the frontmatter.
//
//   node scripts/fetch-patent-thumbnails.mjs
//
// Idempotent: skips entries that already have a thumbnail or that don't
// point at a patents.google.com page.
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { walkMarkdown } from './lib/content-urls.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const thumbDir = join(root, 'public/thumbnails');
if (!existsSync(thumbDir)) mkdirSync(thumbDir, { recursive: true });

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36';

function patentUrlFromText(text) {
  const m = text.match(/paper:\s*"(https:\/\/patents\.google\.com\/[^"]+)"/);
  return m ? m[1] : null;
}

function venueIsPatent(text) {
  const v = text.match(/^venue:\s*"([^"]+)"/m);
  if (!v) return false;
  return /^(US Patent|Filed)/.test(v[1]);
}

async function fetchRepresentativeImage(googlePatentUrl) {
  const res = await fetch(googlePatentUrl, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${googlePatentUrl}`);
  const html = await res.text();

  // Two known URL shapes:
  //   (old) .../b0/f1/c0/4dd5ab6e98824d/US09990587-20180605-D00000.png
  //   (new) .../US20250328768A1/US20250328768A1-20251023-D00000.png
  // Prefer the full-resolution version; fall back to the thumbnails/* one.
  const all = [
    ...html.matchAll(
      /https:\/\/patentimages\.storage\.googleapis\.com\/[A-Za-z0-9_/-]+-D00000\.(?:png|jpg|jpeg)/g,
    ),
  ].map((m) => m[0]);
  const full = all.find((u) => !u.includes('/thumbnails/'));
  return full ?? all[0] ?? null;
}

async function downloadTo(url, dest) {
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  const buf = new Uint8Array(await res.arrayBuffer());
  writeFileSync(dest, buf);
}

const files = walkMarkdown(join(root, 'src/content/publications'));
let processed = 0;
let added = 0;
let skipped = 0;

for (const f of files) {
  const text = readFileSync(f, 'utf8');
  if (!venueIsPatent(text)) continue;
  processed += 1;

  if (/^thumbnail:/m.test(text)) {
    skipped += 1;
    continue;
  }

  const url = patentUrlFromText(text);
  if (!url) {
    console.log(`! ${basename(f)}: no patents.google.com URL — skipping`);
    skipped += 1;
    continue;
  }

  const slug = basename(f, '.md');
  const thumbName = `pub-${slug}.png`;
  const thumbPath = join(thumbDir, thumbName);
  const publicPath = `/thumbnails/${thumbName}`;

  try {
    if (!existsSync(thumbPath)) {
      const imgUrl = await fetchRepresentativeImage(url);
      if (!imgUrl) {
        console.log(`! ${basename(f)}: no representative image found — skipping`);
        skipped += 1;
        continue;
      }
      await downloadTo(imgUrl, thumbPath);
      console.log(`  ${basename(f)}: ${imgUrl} -> ${thumbName}`);
    } else {
      console.log(`  ${basename(f)}: thumbnail already on disk — reusing`);
    }

    // Inject the thumbnail line just before the closing `---`. Use
    // a regex that matches the SECOND `---`.
    const updated = text.replace(/\n---\s*$/m, `\nthumbnail: "${publicPath}"\n---`);
    writeFileSync(f, updated);
    added += 1;
  } catch (e) {
    console.error(`x ${basename(f)}: ${e.message}`);
    skipped += 1;
  }

  // Be polite — don't hammer Google.
  await new Promise((r) => setTimeout(r, 800));
}

console.log(`\nDone. processed=${processed} added=${added} skipped=${skipped}`);
