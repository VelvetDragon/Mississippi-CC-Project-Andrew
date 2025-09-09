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
    slug: z.string().optional(),
    date: z.date(),
    category: z.string().optional(),
    author: z.string().optional(),
    featured: z.boolean().optional(),
    published: z.boolean().optional(),
    backgroundImage: z.string().optional(),
    excerpt: z.string().optional(),
    body: z.string().optional(),
  }),
});

export const collections = { pages, blog };






