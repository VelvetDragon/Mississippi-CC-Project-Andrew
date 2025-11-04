import type { APIRoute } from 'astro';
import { getSessionFromRequest } from '../../../lib/auth';
import { readdir, readFile } from 'fs/promises';
import { join } from 'path';

// Simple frontmatter parser
function parseFrontmatter(content: string) {
  const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
  const match = content.match(frontmatterRegex);
  
  if (!match) {
    return { data: {}, content: content.trim() };
  }

  const frontmatterText = match[1];
  const body = match[2].trim();
  
  const data: any = {};
  const lines = frontmatterText.split('\n');
  
  let currentKey = '';
  let currentValue: string[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const colonIndex = line.indexOf(':');
    
    if (colonIndex > 0 && !line.match(/^\s+/)) {
      // Save previous key-value if exists
      if (currentKey) {
        let value = currentValue.join('\n').trim();
        // Remove quotes if present
        if ((value.startsWith('"') && value.endsWith('"')) || 
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        // Parse boolean
        if (value === 'true') value = true as any;
        if (value === 'false') value = false as any;
        data[currentKey] = value;
      }
      
      // Start new key-value
      currentKey = line.substring(0, colonIndex).trim();
      const valueStart = line.substring(colonIndex + 1).trim();
      currentValue = valueStart ? [valueStart] : [];
    } else if (currentKey && line.trim()) {
      // Continuation of multi-line value
      currentValue.push(line);
    }
  }
  
  // Save last key-value
  if (currentKey) {
    let value = currentValue.join('\n').trim();
    // Remove quotes if present
    if ((value.startsWith('"') && value.endsWith('"')) || 
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    // Parse boolean
    if (value === 'true') value = true as any;
    if (value === 'false') value = false as any;
    data[currentKey] = value;
  }
  
  return { data, content: body };
}

export const prerender = false; // This is a server endpoint

export const GET: APIRoute = async ({ request }) => {
  // Check authentication
  const session = getSessionFromRequest(request);
  if (!session) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const projectRoot = import.meta.env.PROD 
      ? process.cwd() 
      : (process.cwd() || new URL('../../../../', import.meta.url).pathname);
    const blogDir = join(projectRoot, 'src', 'content', 'blog');

    // Read all markdown files
    const files = await readdir(blogDir);
    const markdownFiles = files.filter(f => f.endsWith('.md') && f !== '.gitkeep');

    const posts = [];

    for (const file of markdownFiles) {
      try {
        const filePath = join(blogDir, file);
        const fileContent = await readFile(filePath, 'utf-8');
        const { data: frontmatter, content } = parseFrontmatter(fileContent);

        // Extract slug from filename (format: YYYY-MM-DD-slug.md)
        const slugMatch = file.match(/^\d{4}-\d{2}-\d{2}-(.+)\.md$/);
        const slug = frontmatter.slug || (slugMatch ? slugMatch[1] : file.replace('.md', ''));

        posts.push({
          filename: file,
          title: frontmatter.title || 'Untitled',
          slug: slug,
          date: frontmatter.date || new Date().toISOString(),
          author: frontmatter.author || 'Unknown',
          published: frontmatter.published !== false,
          backgroundImage: frontmatter.backgroundImage || '',
          excerpt: frontmatter.excerpt || '',
          body: content.trim(),
          // Get first 200 chars of content for preview
          preview: content.trim().substring(0, 200) + (content.length > 200 ? '...' : '')
        });
      } catch (error) {
        console.error(`Error reading file ${file}:`, error);
        // Continue with other files
      }
    }

    // Sort by date (newest first)
    posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return new Response(
      JSON.stringify({ 
        success: true, 
        posts: posts,
        count: posts.length
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('List blogs error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error.message,
        posts: []
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

