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

    // Save to public/images directory
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
      console.error('File write error:', writeError);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to save image',
          details: writeError.message 
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  } catch (error: any) {
    console.error('Upload error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

