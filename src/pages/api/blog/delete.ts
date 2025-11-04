import type { APIRoute } from 'astro';
import { getSessionFromRequest } from '../../../lib/auth';
import { unlink, readdir } from 'fs/promises';
import { join } from 'path';

export const prerender = false;

export const DELETE: APIRoute = async ({ request }) => {
  // Check authentication
  const session = getSessionFromRequest(request);
  if (!session) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const body = await request.json();
    const { filename } = body;

    if (!filename) {
      return new Response(
        JSON.stringify({ error: 'Filename is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const projectRoot = import.meta.env.PROD 
      ? process.cwd() 
      : (process.cwd() || new URL('../../../../', import.meta.url).pathname);
    const blogDir = join(projectRoot, 'src', 'content', 'blog');
    const filePath = join(blogDir, filename);

    try {
      // Try to delete the file directly
      await unlink(filePath);
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Blog post deleted successfully' 
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    } catch (error: any) {
      // If direct deletion fails (e.g., on Netlify), try GitHub API
      console.log('Direct file delete failed, trying GitHub API...', error.message);
      
      // Check if GitHub token is available
      const githubToken = import.meta.env.GITHUB_TOKEN;
      if (!githubToken) {
        return new Response(
          JSON.stringify({ 
            error: 'Failed to delete blog post',
            details: 'Direct file delete failed and GitHub token not configured. Set GITHUB_TOKEN environment variable for Netlify deployments.'
          }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }
      
      // Try GitHub API deletion
      return await deleteViaGitHub(filename);
    }
  } catch (error: any) {
    console.error('Delete blog error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to delete blog post', 
        details: error.message 
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

async function deleteViaGitHub(filename: string) {
  const GITHUB_TOKEN = import.meta.env.GITHUB_TOKEN;
  const GITHUB_REPO = import.meta.env.GITHUB_REPO || 'VelvetDragon/Mississippi-CC-Project-Andrew';
  const GITHUB_BRANCH = import.meta.env.GITHUB_BRANCH || 'main';

  if (!GITHUB_TOKEN) {
    return new Response(
      JSON.stringify({ error: 'GitHub token not configured' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const filePath = `src/content/blog/${filename}`;
    
    // First, get the file SHA to delete it
    const getFileResponse = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/contents/${filePath}?ref=${GITHUB_BRANCH}`,
      {
        headers: {
          'Authorization': `token ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      }
    );

    if (!getFileResponse.ok) {
      const error = await getFileResponse.json();
      return new Response(
        JSON.stringify({ error: 'File not found in repository', details: error.message }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const fileData = await getFileResponse.json();
    const sha = fileData.sha;

    // Delete the file via GitHub API
    const deleteResponse = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/contents/${filePath}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `token ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: `Delete blog post: ${filename}`,
          sha: sha,
          branch: GITHUB_BRANCH
        })
      }
    );

    if (!deleteResponse.ok) {
      const error = await deleteResponse.json();
      return new Response(
        JSON.stringify({ error: 'Failed to delete via GitHub API', details: error.message }),
        { status: deleteResponse.status, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Blog post deleted successfully via GitHub' 
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: 'GitHub API error', details: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

