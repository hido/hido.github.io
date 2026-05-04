// Probe every external URL in src/content/ to detect rotted links.
// For each dead URL, look up its Wayback snapshot in src/data/wayback.json
// and print the suggested swap. With --apply, rewrite the MD files in place
// to swap the dead URL for the wayback URL.
//
// Usage:
//   node scripts/check-dead-links.mjs           # just report
//   node scripts/check-dead-links.mjs --apply   # rewrite MDs
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { walkMarkdown, urlsFromFile } from './lib/content-urls.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const APPLY = process.argv.includes('--apply');

const mdFiles = walkMarkdown(join(root, 'src/content'));

// Already-IA URLs aren't worth re-probing.
const skipIA = (u) => u.includes('web.archive.org');

// Build: file -> [urls]
const fileUrls = new Map();
const allUrls = new Set();
for (const f of mdFiles) {
  const urls = urlsFromFile(f, skipIA);
  for (const u of urls) allUrls.add(u);
  if (urls.length) fileUrls.set(f, urls);
}

// Load wayback map
let waybackMap = {};
try {
  waybackMap = JSON.parse(readFileSync(join(root, 'src/data/wayback.json'), 'utf8'));
} catch {}

// Probe each URL. HEAD first; if 4xx/5xx/error, retry with GET (some servers
// reject HEAD).
async function probe(url) {
  const opts = {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    },
    redirect: 'follow',
    signal: AbortSignal.timeout(15000),
  };
  try {
    let r = await fetch(url, { method: 'HEAD', ...opts });
    if (r.status === 405 || r.status === 403) {
      // Some servers refuse HEAD; retry with GET
      r = await fetch(url, { method: 'GET', ...opts });
    }
    return r.status;
  } catch (e) {
    return `error:${e.name}`;
  }
}

console.log(`Probing ${allUrls.size} unique URLs ...\n`);

const dead = [];
const sorted = [...allUrls].sort();
let i = 0;
for (const url of sorted) {
  i += 1;
  const status = await probe(url);
  const ok =
    typeof status === 'number' && status >= 200 && status < 400;
  // 401/403/418 are anti-bot, not really dead — flag separately
  const flaky =
    status === 401 || status === 403 || status === 418 || status === 429;
  if (!ok && !flaky) {
    const replacement = waybackMap[url]?.wayback ?? '(no IA snapshot)';
    dead.push({ url, status, replacement });
    console.log(`✗ [${status}] ${url}`);
    console.log(`    → ${replacement}`);
  } else if (flaky) {
    process.stdout.write(`? [${status}] ${url}\n`);
  } else {
    process.stdout.write(`. [${status}] ${url}\n`);
  }
  // gentle pacing
  await new Promise((r) => setTimeout(r, 300));
}

console.log(`\n${dead.length} dead URL(s) found of ${allUrls.size}.`);

if (!APPLY) {
  if (dead.length) {
    console.log('\nRun with --apply to rewrite MDs (only swaps URLs that have a wayback snapshot).');
  }
  process.exit(dead.length ? 0 : 0);
}

// Apply mode: rewrite MD files
const swaps = dead.filter((d) => d.replacement && d.replacement.startsWith('http'));
if (!swaps.length) {
  console.log('Nothing to apply (no dead URLs have IA snapshots).');
  process.exit(0);
}
console.log(`\nApplying ${swaps.length} swap(s):`);

for (const [file, urls] of fileUrls) {
  const swapsForFile = swaps.filter((s) => urls.includes(s.url));
  if (!swapsForFile.length) continue;
  let text = readFileSync(file, 'utf8');
  for (const s of swapsForFile) {
    text = text.split(s.url).join(s.replacement);
    console.log(`  ${file}: ${s.url} → ${s.replacement}`);
  }
  writeFileSync(file, text);
}
console.log('\nDone. Review with `git diff` before committing.');
