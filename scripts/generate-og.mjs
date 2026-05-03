// Generate OGP images at build time using satori + resvg.
// Outputs PNG files to public/og/ that BaseLayout references via og:image.
//
// Add a new page card by extending the `pages` array and rebuilding.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import satori from 'satori';
import { html as parseHTML } from 'satori-html';
import { Resvg } from '@resvg/resvg-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const outDir = join(root, 'public', 'og');
mkdirSync(outDir, { recursive: true });

// Japanese font (woff is satori-supported; woff2 is not).
const fontPath = join(
  root,
  'node_modules/@fontsource/noto-sans-jp/files/noto-sans-jp-japanese-400-normal.woff',
);
const fontBoldPath = join(
  root,
  'node_modules/@fontsource/noto-sans-jp/files/noto-sans-jp-japanese-700-normal.woff',
);
const fontRegular = readFileSync(fontPath);
const fontBold = readFileSync(fontBoldPath);

// Profile picture (inlined as base64 so satori can render <img>).
const profileBuf = readFileSync(join(root, 'public/images/prof_pic.jpg'));
const profileDataUri = `data:image/jpeg;base64,${profileBuf.toString('base64')}`;

const pages = [
  {
    file: 'default.png',
    eyebrow: 'hido.github.io',
    title: '比戸 将平 — Shohei Hido',
    subtitle: '20年にわたって、先端AI技術の産業応用をリード。',
    accent: '#0284c7', // sky-600
  },
  {
    file: 'talks-and-media.png',
    eyebrow: '講演・メディア掲載',
    title: '登壇イベントとメディア露出',
    subtitle: '製造業の生成AI活用、空調特化LLMほか',
    accent: '#0284c7',
  },
  {
    file: 'publications.png',
    eyebrow: '論文',
    title: '論文誌・国際会議・特許',
    subtitle: '機械学習 / 異常検知 / 密度比推定 / グラフマイニング',
    accent: '#0284c7',
  },
  {
    file: 'blog.png',
    eyebrow: 'Blog',
    title: 'note・X 記事まとめ',
    subtitle: '比戸将平 — Shohei Hido',
    accent: '#0284c7',
  },
];

function template({ eyebrow, title, subtitle, accent }) {
  // satori is strict — every parent div with >1 children needs explicit display.
  return `
    <div style="display:flex; flex-direction:column; width:100%; height:100%; background:#ffffff; font-family:'Noto Sans JP';">
      <div style="display:flex; height:8px; background:${accent};"></div>
      <div style="display:flex; flex:1; align-items:center; padding:56px 72px; gap:60px;">
        <img
          src="${profileDataUri}"
          style="width:280px; height:280px; border-radius:140px; border:6px solid #e5e7eb; object-fit:cover;"
        />
        <div style="display:flex; flex-direction:column; flex:1;">
          <div style="display:flex; font-size:24px; color:${accent}; font-weight:700; letter-spacing:0.04em; margin-bottom:14px;">${eyebrow}</div>
          <div style="display:flex; font-size:54px; font-weight:700; color:#111827; line-height:1.25; margin-bottom:24px;">${title}</div>
          <div style="display:flex; font-size:28px; color:#4b5563; line-height:1.5;">${subtitle}</div>
        </div>
      </div>
      <div style="display:flex; justify-content:flex-end; padding:0 56px 28px 0; font-size:22px; color:#9ca3af; letter-spacing:0.06em;">hido.github.io</div>
    </div>
  `;
}

let count = 0;
for (const p of pages) {
  const markup = parseHTML(template(p));
  const svg = await satori(markup, {
    width: 1200,
    height: 630,
    fonts: [
      { name: 'Noto Sans JP', data: fontRegular, weight: 400, style: 'normal' },
      { name: 'Noto Sans JP', data: fontBold, weight: 700, style: 'normal' },
    ],
  });
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } })
    .render()
    .asPng();
  writeFileSync(join(outDir, p.file), png);
  count += 1;
  console.log(`✓ ${p.file}`);
}

console.log(`Generated ${count} OG images to public/og/`);
