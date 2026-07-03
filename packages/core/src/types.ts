export type CategoryType = 'counter' | 'duration' | 'event' | 'rating' | 'text' | 'custom';

export type FormFieldType =
  | 'number'
  | 'text'
  | 'textarea'
  | 'singleSelect'
  | 'multiSelect'
  | 'date'
  | 'time'
  | 'duration'
  | 'rating'
  | 'boolean';

export type FormFieldSchema = {
  id: string;
  key: string;
  label: string;
  fieldType: FormFieldType;
  required: boolean;
  defaultValue?: unknown;
  options?: string[];
  unit?: string;
  min?: number;
  max?: number;
};

export type RecordCategory = {
  id: string;
  name: string;
  type: CategoryType;
  icon: string;
  color: string;
  sortOrder: number;
  isBuiltIn: boolean;
  isPinnedToToday: boolean;
  schema: FormFieldSchema[];
  createdAt: string;
  updatedAt: string;
};

export type RecordEntry = {
  id: string;
  categoryId: string;
  /** 本地日期，格式 yyyy-MM-dd */
  recordDate: string;
  startedAt?: string;
  endedAt?: string;
  value?: number | string | boolean;
  payload: Record<string, unknown>;
  note?: string;
  createdAt: string;
  updatedAt: string;
};

export type DailyNote = {
  id: string;
  date: string;
  note: string;
  createdAt: string;
  updatedAt: string;
};

/** 睡眠记录 payload（duration 类） */
export type SleepPayload = {
  /** HH:mm，可选：用户可只填时长 */
  startTime?: string;
  endTime?: string;
  durationMinutes: number;
  /** 1-5 */
  quality?: number;
  /** 夜间清醒次数 */
  awakeCount?: number;
  /** 夜间清醒总时长（分钟） */
  awakeMinutes?: number;
  /** 深睡比例 0-100（%） */
  deepSleepPercent?: number;
  /** 睡眠标签：早醒、熬夜、再次入睡困难等，允许自定义增删 */
  sleepTags?: string[];
};

/** 个人状态 payload（rating 类） */
export type MoodPayload = {
  statusTags: string[];
  /** 1-5，可以只记标签/备注不打分 */
  rating?: number;
};

/**
 * 排便单次记录 payload（event 类）。
 * 每次排便一条记录，当日次数 = 当日记录条数；
 * 手动补录可以只有默认时间，不填时长和状态。
 */
export type BowelPayload = {
  /** HH:mm 发生时间 */
  time?: string;
  /** 本次时长（分钟），计时模式由系统记录 */
  durationMinutes?: number;
  /** 大便状态标签，允许自定义增删 */
  stoolTags?: string[];
  /** 计时模式自动生成的记录标记 */
  byTimer?: boolean;
};

/** 焦虑发作 payload（event 类） */
export type AnxietyPayload = {
  /** HH:mm 发生时间 */
  time: string;
  durationMinutes: number;
  /** 1-5 */
  intensity: number;
  triggers: string[];
};
