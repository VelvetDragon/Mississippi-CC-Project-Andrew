import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

export async function GET(context) {
  const blogs = await getCollection('blog');
  
  // Filter only published blogs and sort by date (newest first)
  const publishedBlogs = blogs
    .filter(blog => blog.data.published !== false)
    .sort((a, b) => new Date(b.data.date).getTime() - new Date(a.data.date).getTime());

  // Limit to most recent 20 posts for RSS feed
  // This ensures Mailchimp only sees recent content and won't accidentally send old posts
  // Mailchimp tracks pubDate and only sends NEW items, but limiting the feed provides extra safety
  const recentBlogs = publishedBlogs.slice(0, 20);

  return rss({
    title: 'Mississippi Community Cookbook Project',
    description: 'Culinary tales, historical insights, and recipes from the Mississippi Community Cookbook Project.',
    site: context.site,
    items: recentBlogs.map((post) => ({
      title: post.data.title,
      pubDate: post.data.date,
      description: post.data.excerpt || '',
      link: `/culinary-tales/${post.slug || post.id.replace(/\.md$/, '')}/`,
      // Optional: add custom data like images if Mailchimp supports it in the feed
      customData: post.data.backgroundImage 
        ? `<enclosure url="${context.site}${post.data.backgroundImage}" length="0" type="image/jpeg" />`
        : '',
    })),
    customData: `<language>en-us</language>`,
  });
}
