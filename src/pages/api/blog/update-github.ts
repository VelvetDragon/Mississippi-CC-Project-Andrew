import type { APIRoute } from 'astro';
import { getSessionFromRequest } from '../../../lib/auth';
import { readFile } from 'fs/promises';
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

    // Use GitHub API to update file
    const githubToken = import.meta.env.GITHUB_TOKEN;
    
    if (!githubToken) {
      return new Response(
        JSON.stringify({ 
          error: 'GitHub token not configured',
          message: 'Set GITHUB_TOKEN environment variable to enable blog updates'
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Encode content to base64
    const encodedContent = Buffer.from(content).toString('base64');

    // Get current file SHA (required for GitHub update)
    const repo = 'VelvetDragon/Mississippi-CC-Project-Andrew';
    const filePath = `src/content/blog/${filename}`;
    
    // First, get the current file to get its SHA
    const getFileResponse = await fetch(
      `https://api.github.com/repos/${repo}/contents/${filePath}`,
      {
        headers: {
          'Authorization': `token ${githubToken}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      }
    );

    let sha: string | null = null;
    if (getFileResponse.ok) {
      const fileData = await getFileResponse.json();
      sha = fileData.sha;
    }

    // Update file via GitHub API
    const updatePayload: any = {
      message: `Update blog post: ${title}`,
      content: encodedContent,
      branch: 'main',
    };

    if (sha) {
      updatePayload.sha = sha;
    }

    const githubResponse = await fetch(
      `https://api.github.com/repos/${repo}/contents/${filePath}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `token ${githubToken}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatePayload),
      }
    );

    if (!githubResponse.ok) {
      const error = await githubResponse.json();
      return new Response(
        JSON.stringify({ 
          error: 'Failed to update file on GitHub',
          details: error.message || 'Unknown error'
        }),
        { status: githubResponse.status, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Blog post updated successfully',
        filename,
        note: 'File will be available after GitHub processes the commit (usually within a few seconds)'
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Update blog error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

