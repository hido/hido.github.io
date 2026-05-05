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

  // Sort by JST calendar day descending (newest day first), then by exact
  // time ascending within the same day. The within-day ascent matches how
  // a CV reads: if two events happened on the same day, the earlier one
  // is listed first.
  const jstDay = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const dayKey = (d: Date | undefined): number =>
    d ? Number(jstDay.format(d).replace(/-/g, '')) : -Infinity;

  items.sort((a, b) => {
    const aDay = dayKey(a.date);
    const bDay = dayKey(b.date);
    if (aDay !== bDay) return bDay - aDay;
    return (a.date?.getTime() ?? 0) - (b.date?.getTime() ?? 0);
  });

  return items;
}
