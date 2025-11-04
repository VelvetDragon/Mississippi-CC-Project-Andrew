import type { APIRoute } from 'astro';
import { getSessionFromRequest } from '../../../lib/auth';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { randomBytes } from 'crypto';

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
    const formData = await request.formData();
    const file = formData.get('image') as File;

    if (!file) {
      return new Response(
        JSON.stringify({ error: 'No file provided' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return new Response(
        JSON.stringify({ error: 'File must be an image' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Generate unique filename
    const fileExtension = file.name.split('.').pop() || 'jpg';
    const uniqueName = `${randomBytes(16).toString('hex')}.${fileExtension}`;
    const fileName = `uploaded-${Date.now()}-${uniqueName}`;

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Try direct file write first (works on Reclaim, local dev)
    const projectRoot = import.meta.env.PROD 
      ? process.cwd() 
      : (process.cwd() || new URL('../../../../', import.meta.url).pathname);
    const filePath = join(projectRoot, 'public', 'images', fileName);

    try {
      await writeFile(filePath, buffer);
      
      // Return the URL path
      const imageUrl = `/images/${fileName}`;
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          url: imageUrl,
          message: 'Image uploaded successfully'
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    } catch (writeError: any) {
      // If direct write fails (e.g., on Netlify), try GitHub API
      console.log('Direct file write failed, trying GitHub API...', writeError.message);
      
      const githubToken = import.meta.env.GITHUB_TOKEN;
      if (!githubToken) {
        return new Response(
          JSON.stringify({ 
            error: 'Failed to save image',
            details: 'Direct file write failed and GitHub token not configured. Set GITHUB_TOKEN environment variable for Netlify deployments.'
          }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Upload to GitHub via API
      try {
        const encodedContent = buffer.toString('base64');
        const repo = import.meta.env.GITHUB_REPO || 'VelvetDragon/Mississippi-CC-Project-Andrew';
        const githubPath = `public/images/${fileName}`;
        
        const githubResponse = await fetch(
          `https://api.github.com/repos/${repo}/contents/${githubPath}`,
          {
            method: 'PUT',
            headers: {
              'Authorization': `token ${githubToken}`,
              'Accept': 'application/vnd.github.v3+json',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              message: `Upload image: ${fileName}`,
              content: encodedContent,
              branch: 'main',
            }),
          }
        );

        if (!githubResponse.ok) {
          const error = await githubResponse.json();
          return new Response(
            JSON.stringify({ 
              error: 'Failed to upload image to GitHub',
              details: error.message || 'Unknown error'
            }),
            { status: githubResponse.status, headers: { 'Content-Type': 'application/json' } }
          );
        }

        // Return the URL path
        const imageUrl = `/images/${fileName}`;
        
        return new Response(
          JSON.stringify({ 
            success: true, 
            url: imageUrl,
            message: 'Image uploaded successfully via GitHub',
            note: 'Image will be available after GitHub processes the commit (usually within a few seconds)'
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      } catch (githubError: any) {
        console.error('GitHub upload error:', githubError);
        return new Response(
          JSON.stringify({ 
            error: 'Failed to save image',
            details: `Direct write failed: ${writeError.message}. GitHub upload failed: ${githubError.message}`
          }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }
  } catch (error: any) {
    console.error('Upload error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

