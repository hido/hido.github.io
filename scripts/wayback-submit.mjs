// Submit every external URL that appears in src/content/ to the Internet
// Archive's Save Page Now endpoint, then record the resulting snapshot URL
// in src/data/wayback.json so dead links can be swapped to archive.org URLs
// later.
//
// Modes:
//   node scripts/wayback-submit.mjs           # submit only URLs not yet recorded
//   node scripts/wayback-submit.mjs --refresh # re-submit every URL
//   node scripts/wayback-submit.mjs --check   # exit 1 if any URL is missing
//
// Be patient — IA throttles aggressively. Keep delay between calls ≥ 4s.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { walkMarkdown, urlsFromFile } from './lib/content-urls.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const archivePath = join(root, 'src/data/wayback.json');
const args = new Set(process.argv.slice(2));
const REFRESH = args.has('--refresh');
const CHECK = args.has('--check');

const urls = new Set();
for (const f of walkMarkdown(join(root, 'src/content'))) {
  for (const u of urlsFromFile(f)) urls.add(u);
}
const allUrls = [...urls].sort();

// Step 3: load existing archive map
let archive = {};
try {
  archive = JSON.parse(readFileSync(archivePath, 'utf8'));
} catch {}

// CHECK mode — verify every URL has a recorded snapshot, exit non-zero otherwise
if (CHECK) {
  const missing = allUrls.filter((u) => !archive[u]);
  if (missing.length === 0) {
    console.log(`✓ all ${allUrls.length} URLs are recorded in wayback.json`);
    process.exit(0);
  }
  console.error(`✗ ${missing.length} URL(s) missing from wayback.json:`);
  for (const u of missing) console.error(`  - ${u}`);
  console.error(`\nRun: npm run wayback`);
  process.exit(1);
}

const targets = REFRESH ? allUrls : allUrls.filter((u) => !archive[u]);
console.log(`Total URLs: ${allUrls.length}, will submit: ${targets.length}`);
if (targets.length === 0) {
  console.log('Nothing to do.');
  process.exit(0);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function submitAndCapture(url) {
  // SPN's GET endpoint, when followed through its redirects, lands on the
  // freshly-built snapshot URL (https://web.archive.org/web/<TS>/<URL>).
  // That's the most reliable way to get the snapshot path back — the
  // /wayback/available API has minutes-long propagation delay for fresh
  // captures.
  // Strip URL fragments before submitting — IA archives whole pages, and
  // some endpoints reject fragmented URLs.
  const submitUrl = url.replace(/#.*$/, '');
  try {
    const r = await fetch(`https://web.archive.org/save/${submitUrl}`, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; hido.github.io wayback bot)',
      },
      redirect: 'follow',
    });
    if (r.url && /\/web\/\d{14}\//.test(r.url)) {
      return r.url;
    }
  } catch (e) {
    console.warn(`  (save failed: ${e.message})`);
  }

  // Fallback: query availability API for any pre-existing snapshot
  try {
    const r = await fetch(
      `https://archive.org/wayback/available?url=${encodeURIComponent(submitUrl)}`,
    );
    const j = await r.json();
    return j.archived_snapshots?.closest?.url ?? null;
  } catch {
    return null;
  }
}

let updated = 0;
let failed = 0;
for (const u of targets) {
  process.stdout.write(`→ ${u} ... `);
  const snap = await submitAndCapture(u);
  if (snap) {
    archive[u] = { wayback: snap, capturedAt: new Date().toISOString() };
    updated += 1;
    console.log(snap);
  } else {
    failed += 1;
    console.log('(no snapshot)');
  }
  // Persist incrementally so a long run isn't lost if interrupted.
  const sorted = Object.fromEntries(
    Object.keys(archive).sort().map((k) => [k, archive[k]]),
  );
  mkdirSync(dirname(archivePath), { recursive: true });
  writeFileSync(archivePath, JSON.stringify(sorted, null, 2) + '\n');
  // Be polite to IA. The save call itself blocks ~6–10s, so a small extra
  // delay between iterations is enough to stay below their rate limit.
  await sleep(2000);
}

console.log(`\nUpdated ${updated} entries (${failed} without snapshot) into ${archivePath}`);
