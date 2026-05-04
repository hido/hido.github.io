import type { CollectionEntry } from 'astro:content';

export type ContentItem = {
  id: string;
  title: string;
  date?: Date;
  subtitle: string;
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
      tag: t.data.tag,
      links: t.data.links,
      thumbnail: t.data.thumbnail,
    })),
    ...press.map((p) => ({
      id: p.id,
      title: p.data.title,
      date: p.data.date,
      subtitle: p.data.outlet,
      tag: p.data.tag,
      links: { web: p.data.url },
      thumbnail: p.data.thumbnail,
    })),
    ...awards.map((a) => ({
      id: a.id,
      title: a.data.title,
      date: a.data.date,
      subtitle: a.data.award,
      tag: a.data.tag,
      links: a.data.links,
      thumbnail: a.data.thumbnail,
    })),
  ];

  items.sort((a, b) => {
    const at = a.date ? a.date.getTime() : -Infinity;
    const bt = b.date ? b.date.getTime() : -Infinity;
    return bt - at;
  });

  return items;
}
