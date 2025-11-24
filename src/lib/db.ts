import Database from 'better-sqlite3';
import { join } from 'path';

// Use a file path that persists across server restarts in production
// For dev/local, it will be in the project root
const dbPath = import.meta.env.PROD 
  ? join(process.cwd(), 'subscribers.db') // Production path
  : join(process.cwd(), 'subscribers.db'); // Dev path

let db: Database.Database;

try {
  db = new Database(dbPath);
  
  // Initialize table
  db.exec(`
    CREATE TABLE IF NOT EXISTS subscribers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log('Database initialized at:', dbPath);
} catch (error) {
  console.error('Database initialization failed:', error);
  // Fallback for build time or environments where DB creation fails
  db = {
    prepare: () => ({ run: () => {}, all: () => [], get: () => null })
  } as any;
}

export function addSubscriber(email: string) {
  try {
    const stmt = db.prepare('INSERT OR IGNORE INTO subscribers (email) VALUES (?)');
    const result = stmt.run(email);
    return result.changes > 0; // True if new inserted, false if existed
  } catch (error) {
    console.error('Add subscriber error:', error);
    return false;
  }
}

export function removeSubscriber(email: string) {
  try {
    const stmt = db.prepare('DELETE FROM subscribers WHERE email = ?');
    stmt.run(email);
    return true;
  } catch (error) {
    console.error('Remove subscriber error:', error);
    return false;
  }
}

export function getSubscribers() {
  try {
    const stmt = db.prepare('SELECT email FROM subscribers');
    return stmt.all() as { email: string }[];
  } catch (error) {
    console.error('Get subscribers error:', error);
    return [];
  }
}

