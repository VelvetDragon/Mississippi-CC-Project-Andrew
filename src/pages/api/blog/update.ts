import type { APIRoute } from 'astro';
import { getSessionFromRequest } from '../../../lib/auth';
import { writeFile } from 'fs/promises';
import { join } from 'path';

export const prerender = false; // This is a server endpoint

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
    const { filename, title, slug, date, author, backgroundImage, excerpt, body, published } = data;

    if (!filename) {
      return new Response(
        JSON.stringify({ error: 'Filename is required for updating' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate required fields
    if (!title || !slug || !date || !body) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: title, slug, date, and body are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Format date for frontmatter (ISO string with timezone)
    const publishDate = new Date(date);
    const dateStr = publishDate.toISOString();

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

    // Write file
    const projectRoot = import.meta.env.PROD 
      ? process.cwd() 
      : (process.cwd() || new URL('../../../../', import.meta.url).pathname);
    const filePath = join(projectRoot, 'src', 'content', 'blog', filename);
    
    try {
      await writeFile(filePath, content, 'utf-8');
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Blog post updated successfully',
          filename,
          path: filePath
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    } catch (writeError: any) {
      console.error('File write error:', writeError);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to update file',
          details: writeError.message 
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  } catch (error: any) {
    console.error('Update blog error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

