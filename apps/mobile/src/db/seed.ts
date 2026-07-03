import type { SQLiteDatabase } from 'expo-sqlite';
import { builtInCategories } from '@health-tracker/ui-schema';

/** 首次启动写入内置类别；已存在的 id 不覆盖（幂等） */
export function seedBuiltInCategories(db: SQLiteDatabase): void {
  db.withTransactionSync(() => {
    for (const c of builtInCategories) {
      db.runSync(
        `INSERT OR IGNORE INTO categories
         (id, name, type, icon, color, sort_order, is_built_in, is_pinned_to_today, schema_json, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          c.id,
          c.name,
          c.type,
          c.icon,
          c.color,
          c.sortOrder,
          c.isBuiltIn ? 1 : 0,
          c.isPinnedToToday ? 1 : 0,
          JSON.stringify(c.schema),
          c.createdAt,
          c.updatedAt,
        ],
      );
    }
  });
}
