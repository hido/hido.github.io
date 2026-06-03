// Single combined feed for talks / press / awards / publications.
// Item link points back to /talks-and-media/ or /publications/ since
// individual entries don't have their own pages — the listing pages
// are the canonical view.

import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import type { APIContext } from 'astro';
import { mergeContentItems } from '../utils/content-items';

export async function GET(context: APIContext) {
  const [talks, press, awards, publications] = await Promise.all([
    getCollection('talks'),
    getCollection('press'),
    getCollection('awards'),
    getCollection('publications'),
  ]);

  const merged = mergeContentItems(talks, press, awards);

  type Item = {
    title: string;
    pubDate: Date;
    description: string;
    link: string;
    categories?: string[];
  };

  const talkItems: Item[] = merged
    .filter((it) => it.date)
    .map((it) => {
      const externalLink = it.links?.web ?? it.links?.register ?? it.links?.video;
      return {
        title: `[${it.tag}] ${it.title}`,
        pubDate: it.date!,
        description: it.subtitleDetail ?? it.subtitle,
        link: externalLink ?? `${context.site}talks-and-media/`,
        categories: [it.tag],
      };
    });

  const pubItems: Item[] = publications.map((p) => ({
    title: `[論文] ${p.data.title}`,
    pubDate: p.data.date,
    description: `${p.data.authors}. ${p.data.venue}`,
    link: p.data.links?.paper ?? p.data.links?.web ?? `${context.site?.toString() ?? ''}publications/`,
    categories: ['Publication'],
  }));

  const items = [...talkItems, ...pubItems].sort(
    (a, b) => b.pubDate.getTime() - a.pubDate.getTime(),
  );

  return rss({
    title: '比戸 将平 — Shohei Hido',
    description:
      '講演・メディア掲載・受賞・論文の更新フィード。Recent talks, press, awards, and publications.',
    site: context.site ?? 'https://hido.github.io',
    items,
    customData: '<language>ja</language>',
  });
}
