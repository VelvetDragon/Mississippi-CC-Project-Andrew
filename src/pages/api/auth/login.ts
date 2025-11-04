import type { APIRoute } from 'astro';
import { getAdminCredentials, verifyPassword, createSession } from '../../../lib/auth';

export const prerender = false; // This is a server endpoint

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Check if request has body
    const body = await request.text();
    if (!body) {
      return new Response(
        JSON.stringify({ error: 'Request body is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    const { username, password } = JSON.parse(body);
    
    if (!username || !password) {
      return new Response(
        JSON.stringify({ error: 'Username and password are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    const credentials = getAdminCredentials();
    
    // Verify credentials
    if (username !== credentials.username || !verifyPassword(password, credentials.passwordHash)) {
      return new Response(
        JSON.stringify({ error: 'Invalid username or password' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Create session
    const sessionToken = createSession(username);
    
    // Set cookie
    cookies.set('admin-session', sessionToken, {
      httpOnly: true,
      secure: import.meta.env.PROD,
      sameSite: 'lax',
      maxAge: 24 * 60 * 60, // 24 hours
      path: '/',
    });
    
    return new Response(
      JSON.stringify({ success: true, message: 'Login successful' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Login error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

