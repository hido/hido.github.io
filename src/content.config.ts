import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// Card-style links: every kind TalkCard renders. Used by talks and awards.
// `report` accepts either a single URL or an array, so a panel can
// list every transcript / writeup that was published about it.
const cardLinkSchema = z
  .object({
    slides: z.string().url().optional(),
    web: z.string().url().optional(),
    video: z.string().url().optional(),
    report: z.union([z.string().url(), z.array(z.string().url())]).optional(),
    press: z.string().url().optional(),
    paper: z.string().url().optional(),
  })
  .partial()
  .optional();

// Publications only surface paper / web / slides through PublicationItem,
// so keep the schema honest about that.
const publicationLinkSchema = z
  .object({
    paper: z.string().url().optional(),
    web: z.string().url().optional(),
    slides: z.string().url().optional(),
  })
  .partial()
  .optional();

const talks = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/talks' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    event: z.string(),
    type: z.literal('talk'),
    // Free-form label shown as a card badge. Open-ended so future categories
    // (基調講演, パネル, etc.) can be introduced without a schema change.
    tag: z.string().default('講演'),
    links: cardLinkSchema,
    thumbnail: z.string().optional(),
  }),
});

const publications = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/publications' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    venue: z.string(),
    authors: z.string(),
    type: z.literal('publication'),
    links: publicationLinkSchema,
  }),
});

const press = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/press' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date().optional(),
    outlet: z.string(),
    url: z.string().url(),
    type: z.literal('press'),
    tag: z.string().default('メディア'),
    thumbnail: z.string().optional(),
  }),
});

const awards = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/awards' }),
  schema: z.object({
    title: z.string(),       // award headline shown as the card title
    date: z.coerce.date(),
    award: z.string(),       // organizer + program name + sub-info, shown as subtitle
    type: z.literal('award'),
    tag: z.string().default('表彰'),
    links: cardLinkSchema,
    thumbnail: z.string().optional(),
  }),
});

export const collections = { talks, publications, press, awards };
