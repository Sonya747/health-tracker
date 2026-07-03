/**
 * 日期工具：全部基于本地时区。
 * dateKey 统一为 'yyyy-MM-dd'（本地日期），跨端可复用。
 */

const pad = (n: number) => String(n).padStart(2, '0');

/** Date -> 本地 'yyyy-MM-dd' */
export function toDateKey(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** 'yyyy-MM-dd' -> 本地时区当天 00:00 的 Date */
export function parseDateKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function isValidDateKey(key: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) return false;
  const d = parseDateKey(key);
  return toDateKey(d) === key;
}

export function addDays(key: string, days: number): string {
  const d = parseDateKey(key);
  d.setDate(d.getDate() + days);
  return toDateKey(d);
}

export type DateRange = { start: string; end: string };

/** 包含 dateKey 的一周（周一开始，周日结束） */
export function weekRangeOf(key: string): DateRange {
  const d = parseDateKey(key);
  const weekday = (d.getDay() + 6) % 7; // 周一=0
  const start = addDays(key, -weekday);
  return { start, end: addDays(start, 6) };
}

/** 包含 dateKey 的自然月 */
export function monthRangeOf(key: string): DateRange {
  const d = parseDateKey(key);
  const start = new Date(d.getFullYear(), d.getMonth(), 1);
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  return { start: toDateKey(start), end: toDateKey(end) };
}

/** 区间内所有 dateKey（含两端） */
export function eachDateKey(range: DateRange): string[] {
  const keys: string[] = [];
  let cur = range.start;
  // 上限保护，防止死循环
  for (let i = 0; i < 400 && cur <= range.end; i++) {
    keys.push(cur);
    cur = addDays(cur, 1);
  }
  return keys;
}

/** 分钟数 -> '7小时30分钟' 样式 */
export function formatMinutes(minutes: number): string {
  if (!Number.isFinite(minutes) || minutes <= 0) return '0分钟';
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h === 0) return `${m}分钟`;
  if (m === 0) return `${h}小时`;
  return `${h}小时${m}分钟`;
}

/** 'HH:mm' 是否合法 */
export function isValidTime(time: string): boolean {
  if (!/^\d{2}:\d{2}$/.test(time)) return false;
  const [h, m] = time.split(':').map(Number);
  return h >= 0 && h <= 23 && m >= 0 && m <= 59;
}

/**
 * 由开始/结束时间计算时长（分钟）。
 * 结束时间小于等于开始时间时视为跨天（如 23:00 - 07:00）。
 */
export function durationFromTimes(startTime: string, endTime: string): number {
  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);
  let diff = eh * 60 + em - (sh * 60 + sm);
  if (diff <= 0) diff += 24 * 60;
  return diff;
}

/** 'yyyy-MM-dd' -> '7月3日 周四' 样式（本地展示用） */
export function formatDateKey(key: string): string {
  const d = parseDateKey(key);
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  return `${d.getMonth() + 1}月${d.getDate()}日 ${weekdays[d.getDay()]}`;
}

export function todayKey(): string {
  return toDateKey(new Date());
}
