export type PublicationTag = '論文' | 'パテント';

// Patents are encoded in `venue` (e.g. "US Patent 9,990,587" or
// "Filed (Clayton et al., 2016)") — derive the tag here so the schema
// stays untouched and existing entries don't need a backfill.
export function publicationTag(venue: string): PublicationTag {
  return /^(US Patent|Filed)/.test(venue) ? 'パテント' : '論文';
}
