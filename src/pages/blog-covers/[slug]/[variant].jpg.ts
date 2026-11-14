// Build-time cover images for blog posts, in three sizes:
//   /blog-covers/<slug>/card.jpg  site card thumbnail (16:9)
//   /blog-covers/<slug>/note.jpg  note 見出し画像 (1280×670)
//   /blog-covers/<slug>/x.jpg     X Article cover (5:2)
//
// With `cover:` set, the image is center-cropped to each size (sharp also
// drops EXIF, so phone GPS data never ships). Without it, a title card is
// drawn with satori in the same style as /og/*.png. Drafts get covers too,
// so they can be downloaded for note / X before the note URL exists.
import type { APIRoute, GetStaticPaths } from 'astro';
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import sharp from 'sharp';
import satori from 'satori';
import { html as parseHTML } from 'satori-html';
import { Resvg } from '@resvg/resvg-js';
import {
  allBlogPosts,
  blogDir,
  blogSlug,
  COVER_SIZES,
  type BlogEntry,
  type CoverVariant,
} from '../../../utils/blog';

export const getStaticPaths = (async () => {
  const posts = await allBlogPosts();
  return posts.flatMap((post) =>
    (Object.keys(COVER_SIZES) as CoverVariant[]).map((variant) => ({
      params: { slug: blogSlug(post), variant },
      props: { post, variant },
    })),
  );
}) satisfies GetStaticPaths;

const root = process.cwd();
const fontDir = join(root, 'node_modules/@fontsource/noto-sans-jp/files');
type SatoriFonts = Parameters<typeof satori>[1]['fonts'];
// Built once and reused: satori caches parsed fonts per `fonts` array, so a
// fresh array per call would re-parse the Japanese font every time (~3s).
let shared: { fonts: SatoriFonts; photo: string } | undefined;
function assets() {
  shared ??= {
    fonts: [
      { name: 'Noto Sans JP', data: readFileSync(join(fontDir, 'noto-sans-jp-japanese-400-normal.woff')), weight: 400, style: 'normal' },
      { name: 'Noto Sans JP', data: readFileSync(join(fontDir, 'noto-sans-jp-japanese-700-normal.woff')), weight: 700, style: 'normal' },
    ],
    photo: `data:image/jpeg;base64,${readFileSync(join(root, 'public/images/prof_pic.jpg')).toString('base64')}`,
  };
  return shared;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}

// satori-html returns a React-element-like tree: { type, props: { children, src, ... } }.
type Node = { props?: { src?: string; children?: unknown } };
function injectPhoto(node: unknown, photo: string): void {
  if (Array.isArray(node)) return node.forEach((n) => injectPhoto(n, photo));
  const props = (node as Node | null)?.props;
  if (!props) return;
  if (props.src === '__PHOTO__') props.src = photo;
  injectPhoto(props.children, photo);
}

async function titleCard(title: string, width: number, height: number): Promise<Buffer> {
  const { fonts, photo } = assets();
  const photoSize = Math.round(height * 0.36);
  // Type scales with the average side so the wide X cover (5:2) doesn't end
  // up with tiny text; long titles step down once.
  const u = (width + height) / 2000;
  const titleSize = Math.round(u * (Array.from(title).length > 28 ? 50 : 60));
  const markup = parseHTML(`
    <div style="display:flex; flex-direction:column; width:100%; height:100%; background:#ffffff; font-family:'Noto Sans JP';">
      <div style="display:flex; height:${Math.round(height * 0.013)}px; background:#0284c7;"></div>
      <div style="display:flex; flex:1; align-items:center; padding:0 ${Math.round(width * 0.06)}px; gap:${Math.round(width * 0.045)}px;">
        <div style="display:flex; flex-direction:column; flex:1;">
          <div style="display:flex; font-size:${Math.round(u * 28)}px; color:#0284c7; font-weight:700; letter-spacing:0.04em; margin-bottom:${Math.round(height * 0.03)}px;">Blog</div>
          <div style="display:flex; font-size:${titleSize}px; font-weight:700; color:#111827; line-height:1.35;">${escapeHtml(title)}</div>
        </div>
        <img src="__PHOTO__" style="width:${photoSize}px; height:${photoSize}px; border-radius:${photoSize}px; object-fit:cover;" />
      </div>
      <div style="display:flex; justify-content:space-between; padding:0 ${Math.round(width * 0.06)}px ${Math.round(height * 0.05)}px; font-size:${Math.round(u * 24)}px; color:#6b7280; letter-spacing:0.04em;">
        <div style="display:flex;">比戸 将平 — Shohei Hido</div>
        <div style="display:flex; color:#9ca3af;">hido.github.io</div>
      </div>
    </div>
  `);
  // Swap the real data URI in after parsing: satori-html is very slow
  // (~3s) at scanning a 100KB base64 attribute.
  injectPhoto(markup, photo);
  const svg = await satori(markup as Parameters<typeof satori>[0], {
    width,
    height,
    fonts,
  });
  return Buffer.from(new Resvg(svg, { fitTo: { mode: 'width', value: width } }).render().asPng());
}

async function render(post: BlogEntry, variant: CoverVariant): Promise<Buffer> {
  const { width, height } = COVER_SIZES[variant];
  const source = post.data.cover
    ? readFileSync(resolve(root, blogDir(post), post.data.cover))
    : await titleCard(post.data.title, width, height);
  return sharp(source)
    .rotate() // honor EXIF orientation before it is stripped
    .resize(width, height, { fit: 'cover', position: 'centre' })
    .jpeg({ quality: 85, mozjpeg: true })
    .toBuffer();
}

export const GET: APIRoute = async ({ props }) => {
  const { post, variant } = props as { post: BlogEntry; variant: CoverVariant };
  const body = await render(post, variant);
  return new Response(new Uint8Array(body), { headers: { 'Content-Type': 'image/jpeg' } });
};
