import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const linkSchema = z
  .object({
    slides: z.string().url().optional(),
    paper: z.string().url().optional(),
    web: z.string().url().optional(),
    video: z.string().url().optional(),
    report: z.string().url().optional(),
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
    links: linkSchema,
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
    links: linkSchema,
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
  }),
});

export const collections = { talks, publications, press };
