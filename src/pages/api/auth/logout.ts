import type { APIRoute } from 'astro';
import { deleteSession, getSessionFromRequest } from '../../../lib/auth';

export const prerender = false; // This is a server endpoint

export const POST: APIRoute = async ({ request, cookies }) => {
  const session = getSessionFromRequest(request);
  
  if (session) {
    const cookieHeader = request.headers.get('cookie');
    if (cookieHeader) {
      const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
        const [key, value] = cookie.trim().split('=');
        acc[key] = value;
        return acc;
      }, {} as Record<string, string>);
      
      const token = cookies['admin-session'];
      if (token) {
        deleteSession(token);
      }
    }
  }
  
  // Clear cookie
  cookies.delete('admin-session', { path: '/' });
  
  return new Response(
    JSON.stringify({ success: true, message: 'Logged out successfully' }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
};

