import type { AnxietyPayload, RecordEntry, SleepPayload } from './types';
import { eachDateKey, type DateRange } from './dates';

/** 按日期分组 */
export function groupByDate(records: RecordEntry[]): Map<string, RecordEntry[]> {
  const map = new Map<string, RecordEntry[]>();
  for (const r of records) {
    const list = map.get(r.recordDate) ?? [];
    list.push(r);
    map.set(r.recordDate, list);
  }
  return map;
}

// ---------- 计数类（排便 / 排尿） ----------

export type CounterStats = {
  total: number;
  /** 按记录天数平均（无记录返回 0） */
  dailyAvg: number;
  /** 有记录（次数 > 0 或存在记录）的天数 */
  recordedDays: number;
  /** 区间内每天的次数，无记录为 0 */
  perDay: { date: string; count: number }[];
};

export function computeCounterStats(records: RecordEntry[], range: DateRange): CounterStats {
  const byDate = groupByDate(records);
  const perDay = eachDateKey(range).map((date) => {
    const recs = byDate.get(date) ?? [];
    const count = recs.reduce((sum, r) => sum + (typeof r.value === 'number' ? r.value : 0), 0);
    return { date, count };
  });
  const total = perDay.reduce((s, d) => s + d.count, 0);
  const recordedDays = perDay.filter((d) => byDate.has(d.date)).length;
  const daysInRange = perDay.length;
  return {
    total,
    dailyAvg: daysInRange > 0 ? total / daysInRange : 0,
    recordedDays,
    perDay,
  };
}

// ---------- 时长类（睡眠） ----------

export type DurationStats = {
  /** 记录天数 */
  recordedDays: number;
  avgMinutes: number;
  maxMinutes: number;
  minMinutes: number;
  /** 无记录的天 minutes 为 null */
  perDay: { date: string; minutes: number | null; quality: number | null }[];
  avgQuality: number | null;
};

export function computeDurationStats(records: RecordEntry[], range: DateRange): DurationStats {
  const byDate = groupByDate(records);
  const perDay = eachDateKey(range).map((date) => {
    const recs = byDate.get(date) ?? [];
    if (recs.length === 0) return { date, minutes: null, quality: null };
    let minutes = 0;
    let qualitySum = 0;
    let qualityCount = 0;
    for (const r of recs) {
      const p = r.payload as Partial<SleepPayload>;
      minutes += typeof p.durationMinutes === 'number' ? p.durationMinutes : 0;
      if (typeof p.quality === 'number') {
        qualitySum += p.quality;
        qualityCount++;
      }
    }
    return { date, minutes, quality: qualityCount > 0 ? qualitySum / qualityCount : null };
  });
  const recorded = perDay.filter((d): d is { date: string; minutes: number; quality: number | null } => d.minutes !== null);
  const totalMinutes = recorded.reduce((s, d) => s + d.minutes, 0);
  const qualities = recorded.map((d) => d.quality).filter((q): q is number => q !== null);
  return {
    recordedDays: recorded.length,
    avgMinutes: recorded.length > 0 ? totalMinutes / recorded.length : 0,
    maxMinutes: recorded.length > 0 ? Math.max(...recorded.map((d) => d.minutes)) : 0,
    minMinutes: recorded.length > 0 ? Math.min(...recorded.map((d) => d.minutes)) : 0,
    perDay,
    avgQuality: qualities.length > 0 ? qualities.reduce((s, q) => s + q, 0) / qualities.length : null,
  };
}

// ---------- 事件类（焦虑发作） ----------

export type EventStats = {
  totalCount: number;
  totalDurationMinutes: number;
  avgIntensity: number | null;
  perDay: { date: string; count: number; durationMinutes: number }[];
  /** 出现频率最高的诱因标签，按次数降序 */
  topTriggers: { tag: string; count: number }[];
};

export function computeEventStats(records: RecordEntry[], range: DateRange): EventStats {
  const byDate = groupByDate(records);
  const triggerCounts = new Map<string, number>();
  let intensitySum = 0;
  let intensityCount = 0;

  const perDay = eachDateKey(range).map((date) => {
    const recs = byDate.get(date) ?? [];
    let durationMinutes = 0;
    for (const r of recs) {
      const p = r.payload as Partial<AnxietyPayload>;
      durationMinutes += typeof p.durationMinutes === 'number' ? p.durationMinutes : 0;
      if (typeof p.intensity === 'number') {
        intensitySum += p.intensity;
        intensityCount++;
      }
      for (const tag of p.triggers ?? []) {
        triggerCounts.set(tag, (triggerCounts.get(tag) ?? 0) + 1);
      }
    }
    return { date, count: recs.length, durationMinutes };
  });

  return {
    totalCount: perDay.reduce((s, d) => s + d.count, 0),
    totalDurationMinutes: perDay.reduce((s, d) => s + d.durationMinutes, 0),
    avgIntensity: intensityCount > 0 ? intensitySum / intensityCount : null,
    perDay,
    topTriggers: [...triggerCounts.entries()]
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count),
  };
}

// ---------- 评分类（个人状态） ----------

export type RatingStats = {
  recordedDays: number;
  avgRating: number | null;
  perDay: { date: string; rating: number | null }[];
};

export function computeRatingStats(records: RecordEntry[], range: DateRange): RatingStats {
  const byDate = groupByDate(records);
  const perDay = eachDateKey(range).map((date) => {
    const recs = byDate.get(date) ?? [];
    const ratings = recs
      .map((r) => (typeof r.value === 'number' ? r.value : null))
      .filter((v): v is number => v !== null);
    return { date, rating: ratings.length > 0 ? ratings.reduce((s, v) => s + v, 0) / ratings.length : null };
  });
  const recorded = perDay.filter((d) => d.rating !== null);
  return {
    recordedDays: recorded.length,
    avgRating:
      recorded.length > 0
        ? recorded.reduce((s, d) => s + (d.rating ?? 0), 0) / recorded.length
        : null,
    perDay,
  };
}
