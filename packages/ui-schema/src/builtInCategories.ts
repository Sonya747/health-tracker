import type { RecordCategory } from '@health-tracker/core';

export const BUILT_IN_CATEGORY_IDS = {
  bowel: 'builtin-bowel',
  urination: 'builtin-urination',
  sleep: 'builtin-sleep',
  mood: 'builtin-mood',
  anxiety: 'builtin-anxiety',
} as const;

const SEED_TIME = '2026-01-01T00:00:00.000Z';

/**
 * MVP 内置类别 seed。首次启动写入数据库，
 * 后续版本的自定义类别沿用同一结构。
 */
export const builtInCategories: RecordCategory[] = [
  {
    id: BUILT_IN_CATEGORY_IDS.bowel,
    name: '排便',
    type: 'counter',
    icon: '💩',
    color: '#B08968',
    sortOrder: 1,
    isBuiltIn: true,
    isPinnedToToday: true,
    schema: [
      { id: 'bowel-count', key: 'count', label: '次数', fieldType: 'number', required: true, defaultValue: 0, min: 0, max: 99, unit: '次' },
      { id: 'bowel-note', key: 'note', label: '备注', fieldType: 'textarea', required: false },
    ],
    createdAt: SEED_TIME,
    updatedAt: SEED_TIME,
  },
  {
    id: BUILT_IN_CATEGORY_IDS.urination,
    name: '排尿',
    type: 'counter',
    icon: '💧',
    color: '#4A90D9',
    sortOrder: 2,
    isBuiltIn: true,
    isPinnedToToday: true,
    schema: [
      { id: 'urination-count', key: 'count', label: '次数', fieldType: 'number', required: true, defaultValue: 0, min: 0, max: 99, unit: '次' },
      { id: 'urination-note', key: 'note', label: '备注', fieldType: 'textarea', required: false },
    ],
    createdAt: SEED_TIME,
    updatedAt: SEED_TIME,
  },
  {
    id: BUILT_IN_CATEGORY_IDS.sleep,
    name: '睡眠',
    type: 'duration',
    icon: '😴',
    color: '#7C6FDE',
    sortOrder: 3,
    isBuiltIn: true,
    isPinnedToToday: true,
    schema: [
      { id: 'sleep-start', key: 'startTime', label: '开始时间', fieldType: 'time', required: false },
      { id: 'sleep-end', key: 'endTime', label: '结束时间', fieldType: 'time', required: false },
      { id: 'sleep-duration', key: 'durationMinutes', label: '时长', fieldType: 'duration', required: false, unit: '分钟', min: 1, max: 1440 },
      { id: 'sleep-quality', key: 'quality', label: '睡眠质量', fieldType: 'rating', required: false, min: 1, max: 5 },
      { id: 'sleep-awake-count', key: 'awakeCount', label: '清醒次数', fieldType: 'number', required: false, unit: '次', min: 0, max: 99 },
      { id: 'sleep-awake-minutes', key: 'awakeMinutes', label: '清醒时长', fieldType: 'duration', required: false, unit: '分钟', min: 0, max: 1440 },
      { id: 'sleep-deep-percent', key: 'deepSleepPercent', label: '深睡比例', fieldType: 'number', required: false, unit: '%', min: 0, max: 100 },
      {
        id: 'sleep-tags',
        key: 'sleepTags',
        label: '睡眠标签',
        fieldType: 'multiSelect',
        required: false,
        options: ['早醒', '熬夜', '再次入睡困难', '多梦', '夜间惊醒', '失眠', '夜尿'],
      },
      { id: 'sleep-note', key: 'note', label: '备注', fieldType: 'textarea', required: false },
    ],
    createdAt: SEED_TIME,
    updatedAt: SEED_TIME,
  },
  {
    id: BUILT_IN_CATEGORY_IDS.mood,
    name: '个人状态',
    type: 'rating',
    icon: '🙂',
    color: '#4CAF7D',
    sortOrder: 4,
    isBuiltIn: true,
    isPinnedToToday: true,
    schema: [
      {
        id: 'mood-tags',
        key: 'statusTags',
        label: '状态标签',
        fieldType: 'multiSelect',
        required: false,
        options: ['精力充沛', '平静', '疲惫', '低落', '烦躁', '紧张', '头痛', '胃部不适'],
      },
      { id: 'mood-rating', key: 'rating', label: '评分', fieldType: 'rating', required: false, min: 1, max: 5 },
      { id: 'mood-note', key: 'note', label: '备注', fieldType: 'textarea', required: false },
    ],
    createdAt: SEED_TIME,
    updatedAt: SEED_TIME,
  },
  {
    id: BUILT_IN_CATEGORY_IDS.anxiety,
    name: '焦虑发作',
    type: 'event',
    icon: '🌀',
    color: '#E07A5F',
    sortOrder: 5,
    isBuiltIn: true,
    isPinnedToToday: true,
    schema: [
      { id: 'anxiety-time', key: 'time', label: '发生时间', fieldType: 'time', required: true },
      { id: 'anxiety-duration', key: 'durationMinutes', label: '持续时长', fieldType: 'duration', required: true, unit: '分钟', min: 1, max: 1440 },
      { id: 'anxiety-intensity', key: 'intensity', label: '强度', fieldType: 'rating', required: true, min: 1, max: 5 },
      {
        id: 'anxiety-triggers',
        key: 'triggers',
        label: '诱因',
        fieldType: 'multiSelect',
        required: false,
        options: ['工作压力', '人际关系', '健康担忧', '经济压力', '睡眠不足', '咖啡因', '不明原因'],
      },
      { id: 'anxiety-note', key: 'note', label: '备注', fieldType: 'textarea', required: false },
    ],
    createdAt: SEED_TIME,
    updatedAt: SEED_TIME,
  },
];

/** 睡眠质量 / 状态评分 / 焦虑强度的展示文案 */
export const RATING_LABELS: Record<string, string[]> = {
  sleepQuality: ['很差', '较差', '一般', '较好', '很好'],
  moodRating: ['很差', '较差', '一般', '较好', '很好'],
  anxietyIntensity: ['轻微', '较轻', '中等', '较强', '强烈'],
};

/** 常用睡眠时长快捷选项（分钟） */
export const SLEEP_DURATION_PRESETS = [4 * 60, 5 * 60, 6 * 60, 7 * 60, 8 * 60, 9 * 60];

/** 夜间清醒时长快捷选项（分钟） */
export const AWAKE_DURATION_PRESETS = [5, 10, 15, 30, 60, 90];

/** 焦虑持续时长快捷选项（分钟） */
export const ANXIETY_DURATION_PRESETS = [5, 10, 15, 30, 60, 120];
