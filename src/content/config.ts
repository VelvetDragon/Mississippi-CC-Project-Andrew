import { defineCollection, z } from 'astro:content';

const pages = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    subtitle: z.string().optional(),
    description: z.string().optional(),
  }),
});

const blog = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    date: z.date(),
    description: z.string(),
  }),
});

export const collections = { pages, blog };






