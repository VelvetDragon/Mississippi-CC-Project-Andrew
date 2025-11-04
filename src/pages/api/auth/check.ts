import type { APIRoute } from 'astro';
import { getSessionFromRequest } from '../../../lib/auth';

export const prerender = false; // This is a server endpoint

export const GET: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  
  if (session) {
    return new Response(
      JSON.stringify({ authenticated: true, username: session.username }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }
  
  return new Response(
    JSON.stringify({ authenticated: false }),
    { status: 401, headers: { 'Content-Type': 'application/json' } }
  );
};

