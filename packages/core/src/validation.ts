import { isValidTime } from './dates';

export type ValidationResult = { ok: true } | { ok: false; errors: string[] };

const fail = (errors: string[]): ValidationResult => ({ ok: false, errors });
const pass: ValidationResult = { ok: true };

/** 计数：非负整数，设置上限防误输 */
export function validateCount(value: number): ValidationResult {
  const errors: string[] = [];
  if (!Number.isFinite(value)) errors.push('次数必须是数字');
  else {
    if (!Number.isInteger(value)) errors.push('次数必须是整数');
    if (value < 0) errors.push('次数不能小于 0');
    if (value > 99) errors.push('次数不能超过 99');
  }
  return errors.length > 0 ? fail(errors) : pass;
}

export type SleepInput = {
  startTime?: string;
  endTime?: string;
  durationMinutes?: number;
  quality?: number;
  awakeCount?: number;
  awakeMinutes?: number;
  deepSleepPercent?: number;
  sleepTags?: string[];
};

/**
 * 睡眠：开始+结束时间成对填写，或直接填时长；二者至少其一。
 * 清醒次数/时长、深睡比例、标签均可选。
 */
export function validateSleep(input: SleepInput): ValidationResult {
  const errors: string[] = [];
  const hasStart = !!input.startTime;
  const hasEnd = !!input.endTime;
  const hasDuration = typeof input.durationMinutes === 'number' && input.durationMinutes > 0;

  if (hasStart !== hasEnd) errors.push('开始时间和结束时间需要同时填写');
  if (hasStart && input.startTime && !isValidTime(input.startTime)) errors.push('开始时间格式不正确');
  if (hasEnd && input.endTime && !isValidTime(input.endTime)) errors.push('结束时间格式不正确');
  if (!hasStart && !hasEnd && !hasDuration) errors.push('请填写开始/结束时间，或直接填写睡眠时长');
  if (typeof input.durationMinutes === 'number') {
    if (input.durationMinutes <= 0) errors.push('睡眠时长需要大于 0');
    if (input.durationMinutes > 24 * 60) errors.push('睡眠时长不能超过 24 小时');
  }
  if (input.quality !== undefined && (input.quality < 1 || input.quality > 5)) {
    errors.push('睡眠质量需要在 1-5 之间');
  }
  if (input.awakeCount !== undefined) {
    if (!Number.isInteger(input.awakeCount) || input.awakeCount < 0 || input.awakeCount > 99) {
      errors.push('清醒次数需要是 0-99 的整数');
    }
  }
  if (input.awakeMinutes !== undefined) {
    if (!Number.isFinite(input.awakeMinutes) || input.awakeMinutes < 0) {
      errors.push('清醒时长不能小于 0');
    } else if (typeof input.durationMinutes === 'number' && input.awakeMinutes > input.durationMinutes) {
      errors.push('清醒时长不能超过睡眠总时长');
    } else if (input.awakeMinutes > 24 * 60) {
      errors.push('清醒时长不能超过 24 小时');
    }
  }
  if (input.deepSleepPercent !== undefined) {
    if (
      !Number.isFinite(input.deepSleepPercent) ||
      input.deepSleepPercent < 0 ||
      input.deepSleepPercent > 100
    ) {
      errors.push('深睡比例需要在 0-100 之间');
    }
  }
  return errors.length > 0 ? fail(errors) : pass;
}

export type MoodInput = {
  statusTags: string[];
  rating?: number;
  note?: string;
};

/** 个人状态：至少有标签、评分或备注之一 */
export function validateMood(input: MoodInput): ValidationResult {
  const errors: string[] = [];
  const hasRating = typeof input.rating === 'number';
  if (input.statusTags.length === 0 && !hasRating && !input.note?.trim()) {
    errors.push('请至少选择一个状态标签、评分或填写备注');
  }
  if (hasRating && (input.rating! < 1 || input.rating! > 5)) {
    errors.push('评分需要在 1-5 之间');
  }
  return errors.length > 0 ? fail(errors) : pass;
}

export type BowelEventInput = {
  time?: string;
  durationMinutes?: number;
  stoolTags?: string[];
};

/** 排便单次记录：时间可选但需合法，时长可选 1-240 分钟 */
export function validateBowelEvent(input: BowelEventInput): ValidationResult {
  const errors: string[] = [];
  if (input.time !== undefined && input.time !== '' && !isValidTime(input.time)) {
    errors.push('发生时间格式不正确');
  }
  if (input.durationMinutes !== undefined) {
    if (!Number.isFinite(input.durationMinutes) || input.durationMinutes <= 0) {
      errors.push('时长需要大于 0');
    } else if (input.durationMinutes > 240) {
      errors.push('时长不能超过 240 分钟');
    }
  }
  return errors.length > 0 ? fail(errors) : pass;
}

export type AnxietyInput = {
  time: string;
  durationMinutes: number;
  intensity: number;
  triggers: string[];
  note?: string;
};

/** 焦虑发作：时间必填、时长 > 0、强度 1-5 */
export function validateAnxiety(input: AnxietyInput): ValidationResult {
  const errors: string[] = [];
  if (!input.time) errors.push('请选择发生时间');
  else if (!isValidTime(input.time)) errors.push('发生时间格式不正确');
  if (!Number.isFinite(input.durationMinutes) || input.durationMinutes <= 0) {
    errors.push('持续时长需要大于 0');
  } else if (input.durationMinutes > 24 * 60) {
    errors.push('持续时长不能超过 24 小时');
  }
  if (!Number.isInteger(input.intensity) || input.intensity < 1 || input.intensity > 5) {
    errors.push('强度需要在 1-5 之间');
  }
  return errors.length > 0 ? fail(errors) : pass;
}
