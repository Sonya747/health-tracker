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
};

/** 个人状态 payload（rating 类） */
export type MoodPayload = {
  statusTags: string[];
  /** 1-5，可以只记标签/备注不打分 */
  rating?: number;
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
