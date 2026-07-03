import { describe, expect, it } from 'vitest';
import {
  validateAnxiety,
  validateBowelEvent,
  validateCount,
  validateMood,
  validateSleep,
} from '../src/validation';

describe('validateCount', () => {
  it('接受非负整数', () => {
    expect(validateCount(0).ok).toBe(true);
    expect(validateCount(5).ok).toBe(true);
  });
  it('拒绝负数、小数、超大值', () => {
    expect(validateCount(-1).ok).toBe(false);
    expect(validateCount(1.5).ok).toBe(false);
    expect(validateCount(100).ok).toBe(false);
    expect(validateCount(NaN).ok).toBe(false);
  });
});

describe('validateSleep', () => {
  it('接受成对时间', () => {
    expect(validateSleep({ startTime: '23:00', endTime: '07:00' }).ok).toBe(true);
  });
  it('接受仅时长', () => {
    expect(validateSleep({ durationMinutes: 450, quality: 4 }).ok).toBe(true);
  });
  it('拒绝只填一个时间', () => {
    expect(validateSleep({ startTime: '23:00' }).ok).toBe(false);
  });
  it('拒绝什么都不填', () => {
    expect(validateSleep({}).ok).toBe(false);
  });
  it('拒绝非法时长和质量', () => {
    expect(validateSleep({ durationMinutes: 0 }).ok).toBe(false);
    expect(validateSleep({ durationMinutes: 2000 }).ok).toBe(false);
    expect(validateSleep({ durationMinutes: 450, quality: 6 }).ok).toBe(false);
  });
  it('接受清醒次数/时长、深睡比例和标签', () => {
    expect(
      validateSleep({
        durationMinutes: 450,
        awakeCount: 2,
        awakeMinutes: 30,
        deepSleepPercent: 25,
        sleepTags: ['早醒', '再次入睡困难'],
      }).ok,
    ).toBe(true);
  });
  it('拒绝非法清醒次数/时长和深睡比例', () => {
    expect(validateSleep({ durationMinutes: 450, awakeCount: -1 }).ok).toBe(false);
    expect(validateSleep({ durationMinutes: 450, awakeCount: 1.5 }).ok).toBe(false);
    expect(validateSleep({ durationMinutes: 450, awakeMinutes: -5 }).ok).toBe(false);
    // 清醒时长超过睡眠总时长
    expect(validateSleep({ durationMinutes: 60, awakeMinutes: 90 }).ok).toBe(false);
    expect(validateSleep({ durationMinutes: 450, deepSleepPercent: 101 }).ok).toBe(false);
    expect(validateSleep({ durationMinutes: 450, deepSleepPercent: -1 }).ok).toBe(false);
  });
});

describe('validateMood', () => {
  it('至少要有标签/评分/备注之一', () => {
    expect(validateMood({ statusTags: [] }).ok).toBe(false);
    expect(validateMood({ statusTags: ['平静'] }).ok).toBe(true);
    expect(validateMood({ statusTags: [], rating: 3 }).ok).toBe(true);
    expect(validateMood({ statusTags: [], note: '还行' }).ok).toBe(true);
  });
  it('评分范围 1-5', () => {
    expect(validateMood({ statusTags: [], rating: 0 }).ok).toBe(false);
    expect(validateMood({ statusTags: [], rating: 6 }).ok).toBe(false);
  });
});

describe('validateBowelEvent', () => {
  it('接受完整输入和空输入', () => {
    expect(validateBowelEvent({ time: '08:30', durationMinutes: 10, stoolTags: ['顺畅'] }).ok).toBe(true);
    expect(validateBowelEvent({}).ok).toBe(true); // 手动补空白记录
  });
  it('拒绝非法时间和时长', () => {
    expect(validateBowelEvent({ time: '25:00' }).ok).toBe(false);
    expect(validateBowelEvent({ durationMinutes: 0 }).ok).toBe(false);
    expect(validateBowelEvent({ durationMinutes: 241 }).ok).toBe(false);
  });
});

describe('validateAnxiety', () => {
  const valid = { time: '10:30', durationMinutes: 15, intensity: 3, triggers: [] };
  it('接受合法输入', () => {
    expect(validateAnxiety(valid).ok).toBe(true);
  });
  it('时间必填且合法', () => {
    expect(validateAnxiety({ ...valid, time: '' }).ok).toBe(false);
    expect(validateAnxiety({ ...valid, time: '25:00' }).ok).toBe(false);
  });
  it('时长必须大于 0 且不超过 24 小时', () => {
    expect(validateAnxiety({ ...valid, durationMinutes: 0 }).ok).toBe(false);
    expect(validateAnxiety({ ...valid, durationMinutes: 1441 }).ok).toBe(false);
  });
  it('强度 1-5 整数', () => {
    expect(validateAnxiety({ ...valid, intensity: 0 }).ok).toBe(false);
    expect(validateAnxiety({ ...valid, intensity: 2.5 }).ok).toBe(false);
  });
});
