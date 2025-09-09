// Blog data structure for Culinary Tales
// Date format: YYYY-MM-DD for easy sorting and comparison

export const blogs = [
  // Placeholder for professor's upcoming blogs - will be added when materials are received
  // Currently no published blogs, so all sections will show "Coming Soon"
];

// Helper functions
export function getRecentBlogs(currentDate = '2025-09-09') {
  const oneMonthAgo = new Date(currentDate);
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
  const oneMonthAgoStr = oneMonthAgo.toISOString().split('T')[0];
  
  return blogs
    .filter(blog => blog.published && blog.date >= oneMonthAgoStr)
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 3);
}

export function getPastBlogs(currentDate = '2025-09-09') {
  const oneMonthAgo = new Date(currentDate);
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
  const oneMonthAgoStr = oneMonthAgo.toISOString().split('T')[0];
  
  return blogs
    .filter(blog => blog.published && blog.date < oneMonthAgoStr)
    .sort((a, b) => new Date(b.date) - new Date(a.date));
}

export function getBlogBySlug(slug) {
  return blogs.find(blog => blog.slug === slug);
}

export function getAllPublishedBlogs() {
  return blogs
    .filter(blog => blog.published)
    .sort((a, b) => new Date(b.date) - new Date(a.date));
}
