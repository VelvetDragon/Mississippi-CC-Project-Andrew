import type { APIRoute } from 'astro';
import { getSessionFromRequest } from '../../../lib/auth';

export const prerender = false; // This is a server endpoint

// Alternative blog creation using GitHub API (works on Netlify)
export const POST: APIRoute = async ({ request }) => {
  // Check authentication
  const session = getSessionFromRequest(request);
  if (!session) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const data = await request.json();
    const { title, slug, date, author, backgroundImage, excerpt, body, published } = data;

    // Validate required fields
    if (!title || !slug || !date || !body) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: title, slug, date, and body are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Format date for filename
    const publishDate = new Date(date);
    const year = publishDate.getFullYear();
    const month = String(publishDate.getMonth() + 1).padStart(2, '0');
    const day = String(publishDate.getDate()).padStart(2, '0');
    const dateStr = publishDate.toISOString();

    // Create filename
    const filename = `${year}-${month}-${day}-${slug}.md`;
    
    // Build frontmatter
    const frontmatter = [
      '---',
      `title: ${JSON.stringify(title)}`,
      `slug: ${slug}`,
      `date: ${dateStr}`,
    ];

    if (author) {
      frontmatter.push(`author: ${author}`);
    }

    if (backgroundImage) {
      frontmatter.push(`backgroundImage: ${backgroundImage}`);
    }

    if (excerpt) {
      frontmatter.push(`excerpt: ${JSON.stringify(excerpt)}`);
    }

    frontmatter.push(`published: ${published !== false}`);
    frontmatter.push('---');

    // Combine frontmatter and body
    const content = frontmatter.join('\n') + '\n\n' + body;

    // Use GitHub API to create file
    // Note: This requires GITHUB_TOKEN environment variable
    const githubToken = import.meta.env.GITHUB_TOKEN;
    
    if (!githubToken) {
      return new Response(
        JSON.stringify({ 
          error: 'GitHub token not configured',
          message: 'Set GITHUB_TOKEN environment variable to enable blog creation'
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Encode content to base64
    const encodedContent = Buffer.from(content).toString('base64');

    // Create file via GitHub API
    const repo = 'VelvetDragon/Mississippi-CC-Project-Andrew';
    const filePath = `src/content/blog/${filename}`;
    
    const githubResponse = await fetch(
      `https://api.github.com/repos/${repo}/contents/${filePath}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `token ${githubToken}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: `Add blog post: ${title}`,
          content: encodedContent,
          branch: 'main',
        }),
      }
    );

    if (!githubResponse.ok) {
      const error = await githubResponse.json();
      return new Response(
        JSON.stringify({ 
          error: 'Failed to create file on GitHub',
          details: error.message || 'Unknown error'
        }),
        { status: githubResponse.status, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Blog post created successfully',
        filename,
        note: 'File will be available after GitHub processes the commit (usually within a few seconds)'
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Create blog error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

