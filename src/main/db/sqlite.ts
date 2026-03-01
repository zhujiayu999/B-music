import { app } from 'electron';
import { join } from 'path';

let Database: any = null;
try {
    Database = require('better-sqlite3');
} catch (e) {
    console.error('[SQLite] Failed to load better-sqlite3. Run: npm rebuild better-sqlite3 --runtime=electron --target=31.7.7', e);
}

let db: any = null;

export interface BMusicAccount {
    id: number;
    name: string;
    avatar: string;
    cookies_json: string;
    is_active: number;
}

export function initDB() {
    if (!Database) {
        console.error('[SQLite] better-sqlite3 not available. Account features disabled.');
        return;
    }
    if (db) return;

    try {
        const dbPath = join(app.getPath('userData'), 'bmusic_accounts.db');
        db = new Database(dbPath);

        db.exec(`
            CREATE TABLE IF NOT EXISTS accounts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                avatar TEXT NOT NULL DEFAULT '',
                cookies_json TEXT NOT NULL DEFAULT '[]',
                is_active INTEGER NOT NULL DEFAULT 0
            )
        `);

        // Ensure at least one default account exists
        const { count } = db.prepare('SELECT COUNT(*) as count FROM accounts').get() as { count: number };
        if (count === 0) {
            db.prepare('INSERT INTO accounts (name, is_active) VALUES (?, ?)').run('默认账户', 1);
        } else {
            const { activeCount } = db.prepare('SELECT COUNT(*) as activeCount FROM accounts WHERE is_active = 1').get() as { activeCount: number };
            if (activeCount === 0) {
                const first = db.prepare('SELECT id FROM accounts LIMIT 1').get() as { id: number };
                if (first) db.prepare('UPDATE accounts SET is_active = 1 WHERE id = ?').run(first.id);
            }
        }
    } catch (e) {
        console.error('[SQLite] initDB error:', e);
        db = null;
    }
}

export function getAccounts(): BMusicAccount[] {
    if (!db) return [];
    try { return db.prepare('SELECT * FROM accounts').all() as BMusicAccount[]; }
    catch { return []; }
}

export function getActiveAccount(): BMusicAccount | undefined {
    if (!db) return undefined;
    try { return db.prepare('SELECT * FROM accounts WHERE is_active = 1 LIMIT 1').get() as BMusicAccount; }
    catch { return undefined; }
}

export function createAccount(name: string, avatar: string = ''): BMusicAccount {
    if (!db) throw new Error('[SQLite] Database not initialized');
    db.prepare('UPDATE accounts SET is_active = 0').run();
    const info = db.prepare('INSERT INTO accounts (name, avatar, is_active) VALUES (?, ?, 1)').run(name, avatar);
    return db.prepare('SELECT * FROM accounts WHERE id = ?').get(info.lastInsertRowid) as BMusicAccount;
}

export function deleteAccount(id: number) {
    if (!db) return;
    const { count } = db.prepare('SELECT COUNT(*) as count FROM accounts').get() as { count: number };
    if (count <= 1) throw new Error('Cannot delete the only remaining account.');
    const wasActive = (db.prepare('SELECT is_active FROM accounts WHERE id = ?').get(id) as any)?.is_active === 1;
    db.prepare('DELETE FROM accounts WHERE id = ?').run(id);
    if (wasActive) {
        const first = db.prepare('SELECT id FROM accounts LIMIT 1').get() as { id: number };
        if (first) db.prepare('UPDATE accounts SET is_active = 1 WHERE id = ?').run(first.id);
    }
}

export function switchAccount(id: number): BMusicAccount {
    if (!db) throw new Error('[SQLite] Database not initialized');
    db.prepare('UPDATE accounts SET is_active = 0').run();
    db.prepare('UPDATE accounts SET is_active = 1 WHERE id = ?').run(id);
    return getActiveAccount()!;
}

export function updateActiveAccountCookies(cookies_json: string) {
    if (!db) return;
    const acc = getActiveAccount();
    if (acc) db.prepare('UPDATE accounts SET cookies_json = ? WHERE id = ?').run(cookies_json, acc.id);
}
