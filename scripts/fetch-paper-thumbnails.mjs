// One-shot helper: walk src/content/publications/ for non-patent entries,
// fetch their PDF when one is reachable, render the top portion of page 1
// (title + authors area) to a small landscape PNG, and write a `thumbnail:`
// line into the frontmatter.
//
//   node scripts/fetch-paper-thumbnails.mjs
//
// Idempotent: skips entries that already have a thumbnail. Skips non-PDF
// URLs unless we can guess a PDF location from a known host (jstage, etc.).
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { walkMarkdown } from './lib/content-urls.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const thumbDir = join(root, 'public/thumbnails');
if (!existsSync(thumbDir)) mkdirSync(thumbDir, { recursive: true });

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36';

function venueIsPatent(text) {
  const v = text.match(/^venue:\s*"([^"]+)"/m);
  return v ? /^(US Patent|Filed)/.test(v[1]) : false;
}

function paperUrlFromText(text) {
  const m = text.match(/^  paper:\s*"([^"]+)"/m);
  if (!m) return null;
  return m[1];
}

function webUrlFromText(text) {
  const m = text.match(/^  web:\s*"([^"]+)"/m);
  if (!m) return null;
  return m[1];
}

// Heuristics: convert known landing-page URLs to a direct PDF URL when the
// host follows a predictable pattern. Returns null when we don't know how.
function pdfCandidateUrls(url) {
  const out = [];
  if (!url) return out;
  if (/\.pdf(\?|$)/i.test(url)) out.push(url);

  // jstage: .../article/<journal>/<v>/<i>/<key>/_article -> /_pdf/-char/ja
  const jstage = url.match(/^https:\/\/www\.jstage\.jst\.go\.jp\/article\/([^/]+\/[^/]+\/[^/]+\/[^/]+)\/_article/);
  if (jstage) {
    out.push(`https://www.jstage.jst.go.jp/article/${jstage[1]}/_pdf`);
    out.push(`https://www.jstage.jst.go.jp/article/${jstage[1]}/_pdf/-char/ja`);
  }

  // arxiv abs -> pdf
  const arx = url.match(/^https?:\/\/arxiv\.org\/abs\/([\w.\-/]+)/);
  if (arx) out.push(`https://arxiv.org/pdf/${arx[1]}.pdf`);

  // JMLR landing -> pdf (e.g. /papers/v10/key.html -> /papers/volume10/key/key.pdf)
  const jmlr = url.match(/^https:\/\/www\.jmlr\.org\/papers\/v(\d+)\/([\w.-]+)\.html$/);
  if (jmlr) out.push(`https://www.jmlr.org/papers/volume${jmlr[1]}/${jmlr[2]}/${jmlr[2]}.pdf`);

  return out;
}

async function downloadPdf(url, dest) {
  const res = await fetch(url, {
    headers: { 'User-Agent': UA, Accept: 'application/pdf,*/*' },
    redirect: 'follow',
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const ct = res.headers.get('content-type') ?? '';
  const buf = new Uint8Array(await res.arrayBuffer());
  // Defensive: if the body isn't a PDF, bail. The first 4 bytes of a PDF
  // are %PDF.
  const head = String.fromCharCode(...buf.slice(0, 4));
  if (head !== '%PDF') {
    throw new Error(`not a PDF (content-type=${ct}, head=${JSON.stringify(head)})`);
  }
  writeFileSync(dest, buf);
}

// Render the top ~25% of page 1 to a 480-wide landscape PNG. We render the
// full page first, then crop with magick. pdftoppm is preferred over `gs`
// because it handles Japanese fonts more reliably.
function renderTopBand(pdfPath, outPng) {
  const tmpRoot = `${pdfPath}.page`;
  // Render page 1 at 150 DPI as PNG. -singlefile suppresses the -1 suffix.
  execSync(`pdftoppm -png -singlefile -r 150 -f 1 -l 1 "${pdfPath}" "${tmpRoot}"`, {
    stdio: ['ignore', 'ignore', 'pipe'],
  });
  const fullPng = `${tmpRoot}.png`;
  if (!existsSync(fullPng)) throw new Error('pdftoppm produced no output');

  // Crop to the top band: width = full, height = 28% of width (≈ 16:9 stripe
  // at the top of the page → captures title block + authors). Resize to
  // 480px wide so the output isn't huge.
  execSync(
    `magick "${fullPng}" -gravity North -crop "100%x28%+0+0" +repage -resize 480x "${outPng}"`,
    { stdio: ['ignore', 'ignore', 'pipe'] },
  );
}

const files = walkMarkdown(join(root, 'src/content/publications'));
let processed = 0;
let added = 0;
let skipped = 0;
const tmp = tmpdir();

for (const f of files) {
  const text = readFileSync(f, 'utf8');
  if (venueIsPatent(text)) continue;
  processed += 1;

  if (/^thumbnail:/m.test(text)) {
    skipped += 1;
    continue;
  }

  const candidates = [
    ...pdfCandidateUrls(paperUrlFromText(text)),
    ...pdfCandidateUrls(webUrlFromText(text)),
  ];
  if (!candidates.length) {
    console.log(`! ${basename(f)}: no PDF URL — skipping`);
    skipped += 1;
    continue;
  }

  const slug = basename(f, '.md');
  const thumbName = `pub-${slug}.png`;
  const thumbPath = join(thumbDir, thumbName);
  const publicPath = `/thumbnails/${thumbName}`;
  const tmpPdf = join(tmp, `${slug}.pdf`);

  let downloaded = false;
  let lastErr = null;
  for (const url of candidates) {
    try {
      await downloadPdf(url, tmpPdf);
      console.log(`  ${basename(f)}: fetched ${url}`);
      downloaded = true;
      break;
    } catch (e) {
      lastErr = e;
    }
  }
  if (!downloaded) {
    console.log(`x ${basename(f)}: PDF not reachable (${lastErr?.message ?? 'unknown'})`);
    skipped += 1;
    continue;
  }

  try {
    renderTopBand(tmpPdf, thumbPath);
  } catch (e) {
    console.log(`x ${basename(f)}: render failed (${e.message})`);
    skipped += 1;
    continue;
  }

  const updated = text.replace(/\n---\s*$/m, `\nthumbnail: "${publicPath}"\n---`);
  writeFileSync(f, updated);
  console.log(`  ${basename(f)}: -> ${thumbName}`);
  added += 1;

  await new Promise((r) => setTimeout(r, 400));
}

console.log(`\nDone. processed=${processed} added=${added} skipped=${skipped}`);
