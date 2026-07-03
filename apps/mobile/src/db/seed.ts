import type { SQLiteDatabase } from 'expo-sqlite';
import { builtInCategories } from '@health-tracker/ui-schema';

/**
 * 首次启动写入内置类别；已存在时刷新 schema_json，
 * 保证 App 升级新增的表单字段（如睡眠的清醒次数/标签）能同步到旧数据库。幂等。
 */
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
      // 全字段刷新，保证升级后类别定义（如排便 counter -> event）与代码一致
      db.runSync(
        `UPDATE categories SET name = ?, type = ?, icon = ?, color = ?, sort_order = ?, schema_json = ?
         WHERE id = ? AND is_built_in = 1`,
        [c.name, c.type, c.icon, c.color, c.sortOrder, JSON.stringify(c.schema), c.id],
      );
    }
  });
}
