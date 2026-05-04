// Visual presets for cards. Centralized so adding a new tag value
// (e.g. '基調講演') or a new link kind (e.g. 'podcast') is a one-file change.

export const TAG_COLORS: Record<string, string> = {
  '講演': 'bg-sky-50 text-sky-800 border-sky-200',
  'メディア': 'bg-amber-50 text-amber-800 border-amber-200',
  '表彰': 'bg-rose-50 text-rose-800 border-rose-200',
};

export const TAG_COLOR_FALLBACK = 'bg-gray-50 text-gray-700 border-gray-200';

// Long labels used inside the popup dialog (where links read like a menu).
export const LINK_LABELS: Record<string, string> = {
  web: '公式サイト・イベントページ',
  press: 'プレスリリース',
  slides: 'スライド',
  video: '動画',
  report: 'レポート・記事',
  paper: '論文',
};

// Per-tag overrides — e.g. a メディア card's `web` URL is the article page,
// not an event landing page, so the dialog label should reflect that.
export const LINK_LABELS_BY_TAG: Record<string, Partial<Record<string, string>>> = {
  'メディア': {
    web: 'メディア掲載ページ',
  },
};

export function linkLabel(kind: string, tag?: string): string {
  return (
    (tag && LINK_LABELS_BY_TAG[tag]?.[kind]) ??
    LINK_LABELS[kind] ??
    kind
  );
}

export const LINK_ORDER = ['web', 'press', 'slides', 'video', 'report', 'paper'] as const;

export type LinkKind = (typeof LINK_ORDER)[number];
