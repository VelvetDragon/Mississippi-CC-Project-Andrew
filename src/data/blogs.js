// Blog data management for CMS integration
// This file now reads from CMS-generated markdown files

// Helper functions to read blog content from CMS files
export async function getAllBlogs() {
  try {
    const blogModules = import.meta.glob('../content/blog/*.md');
    const blogs = [];
    
    for (const path in blogModules) {
      const mod = await blogModules[path]();
      const slug = path.split('/').pop()?.replace('.md', '').replace(/^\d{4}-\d{2}-\d{2}-/, '') || '';
      
      blogs.push({
        ...mod.frontmatter,
        content: mod.compiledContent ? mod.compiledContent() : mod.rawContent(),
        slug: mod.frontmatter.slug || slug
      });
    }
    
    return blogs.sort((a, b) => new Date(b.date) - new Date(a.date));
  } catch (error) {
    console.log('No blogs found or error reading blogs:', error);
    return [];
  }
}

export async function getRecentBlogs(currentDate = '2025-09-09') {
  const allBlogs = await getAllBlogs();
  const oneMonthAgo = new Date(currentDate);
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
  const oneMonthAgoStr = oneMonthAgo.toISOString().split('T')[0];
  
  return allBlogs
    .filter(blog => blog.published && blog.date >= oneMonthAgoStr);
}

export async function getPastBlogs(currentDate = '2025-09-09') {
  const allBlogs = await getAllBlogs();
  const oneMonthAgo = new Date(currentDate);
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
  const oneMonthAgoStr = oneMonthAgo.toISOString().split('T')[0];
  
  return allBlogs
    .filter(blog => blog.published && blog.date < oneMonthAgoStr);
}

export async function getBlogBySlug(slug) {
  const allBlogs = await getAllBlogs();
  return allBlogs.find(blog => blog.slug === slug);
}

export async function getAllPublishedBlogs() {
  const allBlogs = await getAllBlogs();
  return allBlogs.filter(blog => blog.published);
}
