import { openDatabaseSync, type SQLiteDatabase } from 'expo-sqlite';
import { migrateBowelCountersToEvents } from './migrations/bowelEvents';
import { seedBuiltInCategories } from './seed';

export const db = openDatabaseSync('health-tracker.db');

type Migration = { sql?: string; js?: (db: SQLiteDatabase) => void };

const MIGRATIONS: Migration[] = [
  // v1: 初始表结构
  {
    sql: `
  CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    icon TEXT NOT NULL,
    color TEXT NOT NULL,
    sort_order INTEGER NOT NULL,
    is_built_in INTEGER NOT NULL DEFAULT 0,
    is_pinned_to_today INTEGER NOT NULL DEFAULT 1,
    schema_json TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS records (
    id TEXT PRIMARY KEY,
    category_id TEXT NOT NULL,
    record_date TEXT NOT NULL,
    started_at TEXT,
    ended_at TEXT,
    value_json TEXT,
    payload_json TEXT NOT NULL,
    note TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (category_id) REFERENCES categories(id)
  );
  CREATE TABLE IF NOT EXISTS daily_notes (
    id TEXT PRIMARY KEY,
    record_date TEXT NOT NULL UNIQUE,
    note TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_records_date ON records(record_date);
  CREATE INDEX IF NOT EXISTS idx_records_category_date ON records(category_id, record_date);
  `,
  },
  // v2: 应用设置 KV 表；排便由「按日计数」改为「按次事件」，旧计数记录转换为事件
  {
    sql: `
  CREATE TABLE IF NOT EXISTS app_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
  `,
    js: migrateBowelCountersToEvents,
  },
];

let initialized = false;

/** 初始化数据库：跑迁移 + seed 内置类别。幂等，可重复调用。 */
export function initDatabase(): void {
  if (initialized) return;
  const row = db.getFirstSync<{ user_version: number }>('PRAGMA user_version');
  const currentVersion = row?.user_version ?? 0;
  for (let v = currentVersion; v < MIGRATIONS.length; v++) {
    db.withTransactionSync(() => {
      const m = MIGRATIONS[v];
      if (m.sql) db.execSync(m.sql);
      if (m.js) m.js(db);
      db.execSync(`PRAGMA user_version = ${v + 1}`);
    });
  }
  seedBuiltInCategories(db);
  initialized = true;
}
