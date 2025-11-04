// Authentication utilities
// For production, use environment variables for credentials

export interface Session {
  username: string;
  expires: number;
}

// Simple session storage (in production, use Redis or database)
const sessions = new Map<string, Session>();

// Get credentials from environment variables
export function getAdminCredentials() {
  const username = import.meta.env.ADMIN_USERNAME || 'admin';
  const passwordHash = import.meta.env.ADMIN_PASSWORD_HASH || '';
  
  // If no password hash is set, use a default (CHANGE THIS!)
  // In production, generate hash using: crypto.createHash('sha256').update(password).digest('hex')
  const defaultHash = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'; // hash of empty string
  
  return {
    username,
    passwordHash: passwordHash || defaultHash,
  };
}

// Verify password (simple hash comparison - in production use bcrypt)
export function verifyPassword(password: string, storedHash: string): boolean {
  // For now, use sync hash comparison
  // In production, stored hash should be pre-computed using: await hashPassword(password)
  const hash = hashPasswordSync(password);
  return hash === storedHash;
}

// Synchronous hash for comparison (simple hash - in production use bcrypt)
export function hashPasswordSync(password: string): string {
  // Simple hash for sync comparison - in production, pre-compute hashes using bcrypt
  // For now, this is a basic hash that works synchronously
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(64, '0');
}

// Generate session token
export function generateSessionToken(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// Create session
export function createSession(username: string): string {
  const token = generateSessionToken();
  const expires = Date.now() + (24 * 60 * 60 * 1000); // 24 hours
  
  sessions.set(token, { username, expires });
  
  // Clean up expired sessions
  cleanupSessions();
  
  return token;
}

// Get session
export function getSession(token: string): Session | null {
  const session = sessions.get(token);
  
  if (!session) {
    return null;
  }
  
  if (session.expires < Date.now()) {
    sessions.delete(token);
    return null;
  }
  
  return session;
}

// Delete session
export function deleteSession(token: string): void {
  sessions.delete(token);
}

// Clean up expired sessions
function cleanupSessions(): void {
  const now = Date.now();
  for (const [token, session] of sessions.entries()) {
    if (session.expires < now) {
      sessions.delete(token);
    }
  }
}

// Get session from cookie
export function getSessionFromRequest(request: Request): Session | null {
  const cookieHeader = request.headers.get('cookie');
  if (!cookieHeader) return null;
  
  const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split('=');
    acc[key] = value;
    return acc;
  }, {} as Record<string, string>);
  
  const token = cookies['admin-session'];
  if (!token) return null;
  
  return getSession(token);
}

