import type { DailyNote, RecordCategory, RecordEntry } from './types';

export type ExportBundle = {
  app: string;
  exportVersion: 1;
  exportedAt: string;
  categories: RecordCategory[];
  records: RecordEntry[];
  dailyNotes: DailyNote[];
};

export function buildExportBundle(
  categories: RecordCategory[],
  records: RecordEntry[],
  dailyNotes: DailyNote[],
  exportedAt: string,
): ExportBundle {
  return {
    app: 'health-tracker',
    exportVersion: 1,
    exportedAt,
    categories,
    records,
    dailyNotes,
  };
}

export function exportToJson(bundle: ExportBundle): string {
  return JSON.stringify(bundle, null, 2);
}

/** CSV 单元格转义：含逗号/引号/换行时用双引号包裹 */
export function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return '';
  const s = typeof value === 'string' ? value : String(value);
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

/**
 * 记录导出 CSV。payload 拍平为 JSON 字符串放在 payload 列，
 * 常用字段（次数/时长/评分等）单列输出，方便表格软件直接读。
 */
export function exportRecordsToCsv(records: RecordEntry[], categories: RecordCategory[]): string {
  const catName = new Map(categories.map((c) => [c.id, c.name]));
  const header = [
    'date',
    'category',
    'value',
    'started_at',
    'ended_at',
    'duration_minutes',
    'quality',
    'awake_count',
    'awake_minutes',
    'deep_sleep_percent',
    'intensity',
    'time',
    'tags',
    'note',
    'payload_json',
    'created_at',
  ];
  const rows = [header.join(',')];
  const sorted = [...records].sort(
    (a, b) => a.recordDate.localeCompare(b.recordDate) || a.createdAt.localeCompare(b.createdAt),
  );
  for (const r of sorted) {
    const p = r.payload as Record<string, unknown>;
    const tags = Array.isArray(p.triggers)
      ? (p.triggers as string[]).join('|')
      : Array.isArray(p.statusTags)
        ? (p.statusTags as string[]).join('|')
        : Array.isArray(p.sleepTags)
          ? (p.sleepTags as string[]).join('|')
          : '';
    rows.push(
      [
        r.recordDate,
        catName.get(r.categoryId) ?? r.categoryId,
        r.value ?? '',
        r.startedAt ?? '',
        r.endedAt ?? '',
        p.durationMinutes ?? '',
        p.quality ?? '',
        p.awakeCount ?? '',
        p.awakeMinutes ?? '',
        p.deepSleepPercent ?? '',
        p.intensity ?? '',
        p.time ?? '',
        tags,
        r.note ?? '',
        Object.keys(p).length > 0 ? JSON.stringify(p) : '',
        r.createdAt,
      ]
        .map(csvEscape)
        .join(','),
    );
  }
  return rows.join('\n');
}

/** 每日备注导出 CSV */
export function exportDailyNotesToCsv(notes: DailyNote[]): string {
  const rows = ['date,note,created_at'];
  const sorted = [...notes].sort((a, b) => a.date.localeCompare(b.date));
  for (const n of sorted) {
    rows.push([n.date, n.note, n.createdAt].map(csvEscape).join(','));
  }
  return rows.join('\n');
}
