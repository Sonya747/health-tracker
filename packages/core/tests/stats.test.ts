import { describe, expect, it } from 'vitest';
import {
  computeCounterStats,
  computeDurationStats,
  computeEventStats,
  computeRatingStats,
} from '../src/stats';
import type { RecordEntry } from '../src/types';

const T = '2026-07-01T08:00:00.000Z';

function rec(partial: Partial<RecordEntry> & Pick<RecordEntry, 'recordDate'>): RecordEntry {
  return {
    id: Math.random().toString(36).slice(2),
    categoryId: 'c',
    payload: {},
    createdAt: T,
    updatedAt: T,
    ...partial,
  };
}

const WEEK = { start: '2026-06-29', end: '2026-07-05' };

describe('computeCounterStats', () => {
  it('汇总每日次数、总数和日均', () => {
    const records = [
      rec({ recordDate: '2026-06-29', value: 2 }),
      rec({ recordDate: '2026-07-01', value: 3 }),
    ];
    const s = computeCounterStats(records, WEEK);
    expect(s.total).toBe(5);
    expect(s.recordedDays).toBe(2);
    expect(s.perDay).toHaveLength(7);
    expect(s.perDay[0]).toEqual({ date: '2026-06-29', count: 2 });
    expect(s.perDay[1].count).toBe(0);
    expect(s.dailyAvg).toBeCloseTo(5 / 7);
  });

  it('空记录返回全 0', () => {
    const s = computeCounterStats([], WEEK);
    expect(s.total).toBe(0);
    expect(s.recordedDays).toBe(0);
    expect(s.dailyAvg).toBe(0);
  });
});

describe('computeDurationStats', () => {
  it('计算平均/最长/最短时长和平均质量', () => {
    const records = [
      rec({ recordDate: '2026-06-29', payload: { durationMinutes: 420, quality: 3 } }),
      rec({ recordDate: '2026-06-30', payload: { durationMinutes: 480, quality: 5 } }),
    ];
    const s = computeDurationStats(records, WEEK);
    expect(s.recordedDays).toBe(2);
    expect(s.avgMinutes).toBe(450);
    expect(s.maxMinutes).toBe(480);
    expect(s.minMinutes).toBe(420);
    expect(s.avgQuality).toBe(4);
    expect(s.perDay[2].minutes).toBeNull();
  });

  it('无质量数据时 avgQuality 为 null', () => {
    const records = [rec({ recordDate: '2026-06-29', payload: { durationMinutes: 400 } })];
    expect(computeDurationStats(records, WEEK).avgQuality).toBeNull();
  });
});

describe('computeEventStats', () => {
  it('统计次数、总时长、平均强度和常见诱因', () => {
    const records = [
      rec({
        recordDate: '2026-06-29',
        payload: { time: '10:00', durationMinutes: 30, intensity: 3, triggers: ['工作压力'] },
      }),
      rec({
        recordDate: '2026-06-29',
        payload: { time: '15:00', durationMinutes: 10, intensity: 5, triggers: ['工作压力', '咖啡因'] },
      }),
      rec({
        recordDate: '2026-07-02',
        payload: { time: '09:00', durationMinutes: 20, intensity: 1, triggers: [] },
      }),
    ];
    const s = computeEventStats(records, WEEK);
    expect(s.totalCount).toBe(3);
    expect(s.totalDurationMinutes).toBe(60);
    expect(s.avgIntensity).toBe(3);
    expect(s.perDay[0]).toEqual({ date: '2026-06-29', count: 2, durationMinutes: 40 });
    expect(s.topTriggers[0]).toEqual({ tag: '工作压力', count: 2 });
  });

  it('空记录', () => {
    const s = computeEventStats([], WEEK);
    expect(s.totalCount).toBe(0);
    expect(s.avgIntensity).toBeNull();
    expect(s.topTriggers).toHaveLength(0);
  });
});

describe('computeRatingStats', () => {
  it('计算平均评分', () => {
    const records = [
      rec({ recordDate: '2026-06-29', value: 4 }),
      rec({ recordDate: '2026-07-01', value: 2 }),
    ];
    const s = computeRatingStats(records, WEEK);
    expect(s.recordedDays).toBe(2);
    expect(s.avgRating).toBe(3);
    expect(s.perDay[1].rating).toBeNull();
  });
});
