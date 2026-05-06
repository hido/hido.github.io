import type { CollectionEntry } from 'astro:content';

export type ContentItem = {
  id: string;
  title: string;
  date?: Date;
  subtitle: string;
  subtitleDetail?: string;
  tag: string;
  links?: {
    slides?: string;
    web?: string;
    video?: string;
    report?: string | string[];
    press?: string;
    paper?: string;
  };
  thumbnail?: string;
  copyright?: string;
};

export function mergeContentItems(
  talks: CollectionEntry<'talks'>[],
  press: CollectionEntry<'press'>[],
  awards: CollectionEntry<'awards'>[],
): ContentItem[] {
  const items: ContentItem[] = [
    ...talks.map((t) => ({
      id: t.id,
      title: t.data.title,
      date: t.data.date,
      subtitle: t.data.event,
      subtitleDetail: t.data.eventDetail,
      tag: t.data.tag,
      links: t.data.links,
      thumbnail: t.data.thumbnail,
      copyright: t.data.copyright,
    })),
    ...press.map((p) => ({
      id: p.id,
      title: p.data.title,
      date: p.data.date,
      subtitle: p.data.outlet,
      tag: p.data.tag,
      links: { web: p.data.url },
      thumbnail: p.data.thumbnail,
      copyright: p.data.copyright,
    })),
    ...awards.map((a) => ({
      id: a.id,
      title: a.data.title,
      date: a.data.date,
      subtitle: a.data.award,
      subtitleDetail: a.data.awardDetail,
      tag: a.data.tag,
      links: a.data.links,
      thumbnail: a.data.thumbnail,
      copyright: a.data.copyright,
    })),
  ];

  // Sort by full datetime descending (newest first). Same convention
  // applies within a single day: the later event of the day appears
  // above the earlier one, matching the rest of the descending listing.
  items.sort((a, b) => {
    const at = a.date?.getTime() ?? -Infinity;
    const bt = b.date?.getTime() ?? -Infinity;
    return bt - at;
  });

  return items;
}
