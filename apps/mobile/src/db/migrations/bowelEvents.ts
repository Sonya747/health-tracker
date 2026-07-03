import type { SQLiteDatabase } from 'expo-sqlite';

const BOWEL_CATEGORY_ID = 'builtin-bowel';

let migrationIdCounter = 0;

function migrationId(): string {
  migrationIdCounter++;
  return `${Date.now().toString(36)}-m${migrationIdCounter.toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * v2 迁移：排便从「每日一条计数记录（payload.count = N）」
 * 改为「每次一条事件记录（value = 1）」。
 * 旧计数记录展开成 N 条无详情事件（时间未知），备注保留在第一条上；
 * count = 0 的记录直接删除。在 v2 的 user_version 门控内执行，天然幂等。
 */
export function migrateBowelCountersToEvents(db: SQLiteDatabase): void {
  const rows = db.getAllSync<{
    id: string;
    record_date: string;
    payload_json: string;
    note: string | null;
    created_at: string;
    updated_at: string;
  }>('SELECT id, record_date, payload_json, note, created_at, updated_at FROM records WHERE category_id = ?', [
    BOWEL_CATEGORY_ID,
  ]);

  for (const row of rows) {
    let payload: Record<string, unknown>;
    try {
      payload = JSON.parse(row.payload_json) as Record<string, unknown>;
    } catch {
      payload = {};
    }
    // 只转换旧格式（带 count 字段的计数记录）；已是事件格式的跳过
    if (typeof payload.count !== 'number') continue;

    const count = Math.max(0, Math.floor(payload.count));
    db.runSync('DELETE FROM records WHERE id = ?', [row.id]);
    for (let i = 0; i < count; i++) {
      db.runSync(
        `INSERT INTO records
         (id, category_id, record_date, started_at, ended_at, value_json, payload_json, note, created_at, updated_at)
         VALUES (?, ?, ?, NULL, NULL, ?, ?, ?, ?, ?)`,
        [
          migrationId(),
          BOWEL_CATEGORY_ID,
          row.record_date,
          JSON.stringify(1),
          JSON.stringify({}),
          i === 0 ? row.note : null,
          row.created_at,
          row.updated_at,
        ],
      );
    }
  }
}
