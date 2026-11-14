import { getCollection, type CollectionEntry } from 'astro:content';
import { dirname, basename, join } from 'node:path';
import { existsSync } from 'node:fs';

export type BlogEntry = CollectionEntry<'blog'>;

export const EXCERPT_LENGTH = 100;

/** URL-safe slug = the post's folder name, e.g. "2026-11-20-ai-native". */
export function blogSlug(entry: BlogEntry): string {
  return basename(dirname(entry.filePath ?? entry.id));
}

/** Folder holding the manuscript + images, relative to the project root. */
export function blogDir(entry: BlogEntry): string {
  return dirname(entry.filePath!);
}

const COVER_NAMES = ['cover.jpg', 'cover.jpeg', 'cover.png', 'cover.webp'];

/** cover.jpg / cover.png … in the post folder, if present (project-relative). */
export function coverSource(entry: BlogEntry): string | undefined {
  return COVER_NAMES.map((n) => join(blogDir(entry), n)).find((p) => existsSync(p));
}

export type CoverVariant = 'card' | 'note' | 'x';

// card: site thumbnail (16:9, same as other cards)
// note: note 見出し画像 (1280×670)
// x:    X Article cover (5:2)
export const COVER_SIZES: Record<CoverVariant, { width: number; height: number }> = {
  card: { width: 1280, height: 720 },
  note: { width: 1280, height: 670 },
  x: { width: 1500, height: 600 },
};

export function coverUrl(entry: BlogEntry, variant: CoverVariant = 'card'): string {
  return `/blog-covers/${blogSlug(entry)}/${variant}.jpg`;
}

/** Strip Markdown down to plain prose for the excerpt. */
export function markdownToPlain(md: string): string {
  return md
    .replace(/```[\s\S]*?```/g, ' ') // fenced code
    .replace(/<!--[\s\S]*?-->/g, ' ') // HTML comments
    .replace(/<[^>]+>/g, ' ') // inline HTML
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ') // images
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1') // links → text
    .replace(/^\s{0,3}#{1,6}\s.*$/gm, ' ') // headings: drop the whole line
    .replace(/^\s{0,3}(>|[-*+]|\d+\.)\s+/gm, '') // quotes, list markers
    .replace(/^\s*([-*_]\s*){3,}$/gm, ' ') // horizontal rules
    .replace(/(\*\*|__|\*|_|~~|`)/g, '') // emphasis / inline code
    .replace(/\s+/g, ' ')
    // Japanese has no word spaces: drop the gap left between paragraphs.
    .replace(/([\u3000-\u9fff\uff00-\uffef])\s+(?=[\u3000-\u9fff\uff00-\uffef])/g, '$1')
    .trim();
}

export function blogExcerpt(entry: BlogEntry, length = EXCERPT_LENGTH): string {
  if (entry.data.excerpt) return entry.data.excerpt;
  // Count by code point so Japanese text and emoji aren't split mid-char.
  const chars = Array.from(markdownToPlain(entry.body ?? ''));
  return chars.length > length ? chars.slice(0, length).join('') + '…' : chars.join('');
}

/** Every post folder (drafts included) — used for cover generation. */
export async function allBlogPosts(): Promise<BlogEntry[]> {
  const posts = await getCollection('blog');
  // One manuscript per folder: two .md files would fight over one slug.
  const seen = new Map<string, string>();
  for (const p of posts) {
    const slug = blogSlug(p);
    if (seen.has(slug)) {
      throw new Error(`blog: more than one .md in ${blogDir(p)} (${seen.get(slug)}, ${p.filePath})`);
    }
    seen.set(slug, p.filePath!);
  }
  return posts;
}

/** Posts that are live on note, newest first. */
export async function publishedBlogPosts(): Promise<BlogEntry[]> {
  const posts = await getCollection('blog', (p) => Boolean(p.data.note));
  return posts.sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}
