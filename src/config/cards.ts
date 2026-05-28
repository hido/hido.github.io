// Visual presets for cards. Centralized so adding a new tag value
// (e.g. '基調講演') or a new link kind (e.g. 'podcast') is a one-file change.

export const TAG_COLORS: Record<string, string> = {
  '講演': 'bg-sky-500/15 text-sky-200 border-sky-700/60',
  'メディア': 'bg-amber-500/15 text-amber-200 border-amber-700/60',
  '表彰': 'bg-rose-500/15 text-rose-200 border-rose-700/60',
  '予定': 'bg-indigo-500/20 text-indigo-200 border-indigo-600/70',
};

export const TAG_COLOR_FALLBACK = 'bg-slate-700/40 text-slate-200 border-slate-600';

// Long labels used inside the popup dialog (where links read like a menu).
export const LINK_LABELS: Record<string, string> = {
  register: '申込ページ',
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

export const LINK_ORDER = ['register', 'web', 'press', 'slides', 'video', 'report', 'paper'] as const;

export type LinkKind = (typeof LINK_ORDER)[number];
