import type { DailyNote, RecordCategory, RecordEntry } from '@health-tracker/core';
import { db } from './client';

let idCounter = 0;

/** 本地生成唯一 id（无网络、无原生依赖） */
export function genId(): string {
  idCounter = (idCounter + 1) % 10000;
  return `${Date.now().toString(36)}-${idCounter.toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

const nowIso = () => new Date().toISOString();

// ---------- row mapping ----------

type CategoryRow = {
  id: string;
  name: string;
  type: string;
  icon: string;
  color: string;
  sort_order: number;
  is_built_in: number;
  is_pinned_to_today: number;
  schema_json: string;
  created_at: string;
  updated_at: string;
};

type RecordRow = {
  id: string;
  category_id: string;
  record_date: string;
  started_at: string | null;
  ended_at: string | null;
  value_json: string | null;
  payload_json: string;
  note: string | null;
  created_at: string;
  updated_at: string;
};

type DailyNoteRow = {
  id: string;
  record_date: string;
  note: string;
  created_at: string;
  updated_at: string;
};

function mapCategory(row: CategoryRow): RecordCategory {
  return {
    id: row.id,
    name: row.name,
    type: row.type as RecordCategory['type'],
    icon: row.icon,
    color: row.color,
    sortOrder: row.sort_order,
    isBuiltIn: row.is_built_in === 1,
    isPinnedToToday: row.is_pinned_to_today === 1,
    schema: JSON.parse(row.schema_json),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapRecord(row: RecordRow): RecordEntry {
  return {
    id: row.id,
    categoryId: row.category_id,
    recordDate: row.record_date,
    startedAt: row.started_at ?? undefined,
    endedAt: row.ended_at ?? undefined,
    value: row.value_json !== null ? JSON.parse(row.value_json) : undefined,
    payload: JSON.parse(row.payload_json),
    note: row.note ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapDailyNote(row: DailyNoteRow): DailyNote {
  return {
    id: row.id,
    date: row.record_date,
    note: row.note,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ---------- categories ----------

export function getCategories(): RecordCategory[] {
  const rows = db.getAllSync<CategoryRow>('SELECT * FROM categories ORDER BY sort_order ASC');
  return rows.map(mapCategory);
}

// ---------- records ----------

export function getRecordsByDate(date: string): RecordEntry[] {
  const rows = db.getAllSync<RecordRow>(
    'SELECT * FROM records WHERE record_date = ? ORDER BY created_at ASC',
    [date],
  );
  return rows.map(mapRecord);
}

export function getRecordsByRange(start: string, end: string, categoryId?: string): RecordEntry[] {
  const rows = categoryId
    ? db.getAllSync<RecordRow>(
        'SELECT * FROM records WHERE record_date BETWEEN ? AND ? AND category_id = ? ORDER BY record_date ASC, created_at ASC',
        [start, end, categoryId],
      )
    : db.getAllSync<RecordRow>(
        'SELECT * FROM records WHERE record_date BETWEEN ? AND ? ORDER BY record_date ASC, created_at ASC',
        [start, end],
      );
  return rows.map(mapRecord);
}

export function getRecordById(id: string): RecordEntry | null {
  const row = db.getFirstSync<RecordRow>('SELECT * FROM records WHERE id = ?', [id]);
  return row ? mapRecord(row) : null;
}

/** 单日单条类别（计数/睡眠/状态）取第一条 */
export function getSingleRecord(categoryId: string, date: string): RecordEntry | null {
  const row = db.getFirstSync<RecordRow>(
    'SELECT * FROM records WHERE category_id = ? AND record_date = ? ORDER BY created_at ASC LIMIT 1',
    [categoryId, date],
  );
  return row ? mapRecord(row) : null;
}

export type NewRecordInput = {
  categoryId: string;
  recordDate: string;
  startedAt?: string;
  endedAt?: string;
  value?: number | string | boolean;
  payload: Record<string, unknown>;
  note?: string;
};

export function insertRecord(input: NewRecordInput): RecordEntry {
  const id = genId();
  const now = nowIso();
  db.runSync(
    `INSERT INTO records
     (id, category_id, record_date, started_at, ended_at, value_json, payload_json, note, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      input.categoryId,
      input.recordDate,
      input.startedAt ?? null,
      input.endedAt ?? null,
      input.value !== undefined ? JSON.stringify(input.value) : null,
      JSON.stringify(input.payload),
      input.note ?? null,
      now,
      now,
    ],
  );
  return getRecordById(id)!;
}

export function updateRecord(
  id: string,
  patch: Partial<Omit<NewRecordInput, 'categoryId' | 'recordDate'>>,
): RecordEntry | null {
  const existing = getRecordById(id);
  if (!existing) return null;
  const merged = {
    startedAt: 'startedAt' in patch ? patch.startedAt : existing.startedAt,
    endedAt: 'endedAt' in patch ? patch.endedAt : existing.endedAt,
    value: 'value' in patch ? patch.value : existing.value,
    payload: patch.payload ?? existing.payload,
    note: 'note' in patch ? patch.note : existing.note,
  };
  db.runSync(
    `UPDATE records SET started_at = ?, ended_at = ?, value_json = ?, payload_json = ?, note = ?, updated_at = ?
     WHERE id = ?`,
    [
      merged.startedAt ?? null,
      merged.endedAt ?? null,
      merged.value !== undefined ? JSON.stringify(merged.value) : null,
      JSON.stringify(merged.payload),
      merged.note ?? null,
      nowIso(),
      id,
    ],
  );
  return getRecordById(id);
}

export function deleteRecord(id: string): void {
  db.runSync('DELETE FROM records WHERE id = ?', [id]);
}

// ---------- daily notes ----------

export function getDailyNote(date: string): DailyNote | null {
  const row = db.getFirstSync<DailyNoteRow>('SELECT * FROM daily_notes WHERE record_date = ?', [date]);
  return row ? mapDailyNote(row) : null;
}

export function upsertDailyNote(date: string, note: string): DailyNote {
  const existing = getDailyNote(date);
  const now = nowIso();
  if (existing) {
    db.runSync('UPDATE daily_notes SET note = ?, updated_at = ? WHERE record_date = ?', [note, now, date]);
  } else {
    db.runSync(
      'INSERT INTO daily_notes (id, record_date, note, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
      [genId(), date, note, now, now],
    );
  }
  return getDailyNote(date)!;
}

export function deleteDailyNote(date: string): void {
  db.runSync('DELETE FROM daily_notes WHERE record_date = ?', [date]);
}

// ---------- app settings (KV) ----------

export function getSetting(key: string): string | null {
  const row = db.getFirstSync<{ value: string }>('SELECT value FROM app_settings WHERE key = ?', [key]);
  return row?.value ?? null;
}

export function setSetting(key: string, value: string): void {
  db.runSync(
    'INSERT INTO app_settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
    [key, value],
  );
}

export function deleteSetting(key: string): void {
  db.runSync('DELETE FROM app_settings WHERE key = ?', [key]);
}

// ---------- export ----------

export function getAllRecords(): RecordEntry[] {
  return db
    .getAllSync<RecordRow>('SELECT * FROM records ORDER BY record_date ASC, created_at ASC')
    .map(mapRecord);
}

export function getAllDailyNotes(): DailyNote[] {
  return db.getAllSync<DailyNoteRow>('SELECT * FROM daily_notes ORDER BY record_date ASC').map(mapDailyNote);
}
