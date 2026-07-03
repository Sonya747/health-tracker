import { describe, expect, it } from 'vitest';
import {
  addDays,
  durationFromTimes,
  eachDateKey,
  formatMinutes,
  isValidDateKey,
  isValidTime,
  monthRangeOf,
  parseDateKey,
  toDateKey,
  weekRangeOf,
} from '../src/dates';

describe('dates', () => {
  it('toDateKey / parseDateKey 往返一致（本地时区）', () => {
    const d = new Date(2026, 6, 3); // 2026-07-03 本地
    expect(toDateKey(d)).toBe('2026-07-03');
    expect(toDateKey(parseDateKey('2026-07-03'))).toBe('2026-07-03');
  });

  it('isValidDateKey 拒绝非法日期', () => {
    expect(isValidDateKey('2026-07-03')).toBe(true);
    expect(isValidDateKey('2026-02-30')).toBe(false);
    expect(isValidDateKey('2026-7-3')).toBe(false);
    expect(isValidDateKey('abc')).toBe(false);
  });

  it('addDays 跨月跨年', () => {
    expect(addDays('2026-07-03', 1)).toBe('2026-07-04');
    expect(addDays('2026-07-31', 1)).toBe('2026-08-01');
    expect(addDays('2026-01-01', -1)).toBe('2025-12-31');
  });

  it('weekRangeOf 周一开始', () => {
    // 2026-07-03 是周五
    expect(weekRangeOf('2026-07-03')).toEqual({ start: '2026-06-29', end: '2026-07-05' });
    // 周一自身
    expect(weekRangeOf('2026-06-29').start).toBe('2026-06-29');
    // 周日归属本周
    expect(weekRangeOf('2026-07-05').start).toBe('2026-06-29');
  });

  it('monthRangeOf 自然月', () => {
    expect(monthRangeOf('2026-07-15')).toEqual({ start: '2026-07-01', end: '2026-07-31' });
    expect(monthRangeOf('2026-02-10')).toEqual({ start: '2026-02-01', end: '2026-02-28' });
    expect(monthRangeOf('2028-02-10').end).toBe('2028-02-29'); // 闰年
  });

  it('eachDateKey 包含两端', () => {
    const keys = eachDateKey({ start: '2026-06-29', end: '2026-07-05' });
    expect(keys).toHaveLength(7);
    expect(keys[0]).toBe('2026-06-29');
    expect(keys[6]).toBe('2026-07-05');
  });

  it('formatMinutes', () => {
    expect(formatMinutes(0)).toBe('0分钟');
    expect(formatMinutes(45)).toBe('45分钟');
    expect(formatMinutes(60)).toBe('1小时');
    expect(formatMinutes(450)).toBe('7小时30分钟');
  });

  it('isValidTime', () => {
    expect(isValidTime('23:59')).toBe(true);
    expect(isValidTime('00:00')).toBe(true);
    expect(isValidTime('24:00')).toBe(false);
    expect(isValidTime('9:30')).toBe(false);
  });

  it('durationFromTimes 支持跨天', () => {
    expect(durationFromTimes('22:00', '06:30')).toBe(510);
    expect(durationFromTimes('01:00', '09:00')).toBe(480);
    expect(durationFromTimes('23:00', '23:00')).toBe(1440); // 视为跨天整天
  });
});
