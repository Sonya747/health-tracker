import { describe, expect, it } from 'vitest';
import { buildExportBundle, csvEscape, exportRecordsToCsv, exportToJson } from '../src/export';
import type { RecordCategory, RecordEntry } from '../src/types';

const T = '2026-07-01T08:00:00.000Z';

const category: RecordCategory = {
  id: 'builtin-anxiety',
  name: '焦虑发作',
  type: 'event',
  icon: '🌀',
  color: '#E07A5F',
  sortOrder: 5,
  isBuiltIn: true,
  isPinnedToToday: true,
  schema: [],
  createdAt: T,
  updatedAt: T,
};

const record: RecordEntry = {
  id: 'r1',
  categoryId: 'builtin-anxiety',
  recordDate: '2026-07-01',
  payload: { time: '10:00', durationMinutes: 30, intensity: 3, triggers: ['工作压力', '咖啡因'] },
  note: '备注，含逗号和"引号"',
  createdAt: T,
  updatedAt: T,
};

describe('csvEscape', () => {
  it('普通值原样返回', () => {
    expect(csvEscape('abc')).toBe('abc');
    expect(csvEscape(3)).toBe('3');
    expect(csvEscape(null)).toBe('');
  });
  it('逗号/引号/换行会被转义', () => {
    expect(csvEscape('a,b')).toBe('"a,b"');
    expect(csvEscape('a"b')).toBe('"a""b"');
    expect(csvEscape('a\nb')).toBe('"a\nb"');
  });
});

describe('export', () => {
  it('JSON 导出可以解析回原数据', () => {
    const bundle = buildExportBundle([category], [record], [], T);
    const parsed = JSON.parse(exportToJson(bundle));
    expect(parsed.app).toBe('health-tracker');
    expect(parsed.records[0].payload.triggers).toEqual(['工作压力', '咖啡因']);
  });

  it('CSV 导出包含表头和转义后的备注', () => {
    const csv = exportRecordsToCsv([record], [category]);
    const lines = csv.split('\n');
    expect(lines[0].startsWith('date,category,value')).toBe(true);
    expect(lines[1]).toContain('焦虑发作');
    expect(lines[1]).toContain('"备注，含逗号和""引号"""');
    expect(lines[1]).toContain('工作压力|咖啡因');
  });
});
