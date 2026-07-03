import { create } from 'zustand';
import type {
  AnxietyPayload,
  BowelPayload,
  DailyNote,
  MoodPayload,
  RecordEntry,
  SleepPayload,
} from '@health-tracker/core';
import { toDateKey, todayKey, validateCount } from '@health-tracker/core';
import {
  BUILT_IN_CATEGORY_IDS,
  DEFAULT_BOWEL_RECORD_MODE,
  DEFAULT_BOWEL_REMINDER_MINUTES,
  type BowelRecordMode,
} from '@health-tracker/ui-schema';
import { initDatabase } from '../db/client';
import * as repo from '../db/repo';
import { cancelBowelReminder, scheduleBowelReminder } from '../features/bowelTimer';

export type DayData = {
  date: string;
  bowelEvents: RecordEntry[];
  urination: RecordEntry | null;
  sleep: RecordEntry | null;
  mood: RecordEntry | null;
  anxietyEvents: RecordEntry[];
  dailyNote: DailyNote | null;
};

const sortByTime = (a: RecordEntry, b: RecordEntry) => {
  const ta = String((a.payload as { time?: string }).time ?? '');
  const tb = String((b.payload as { time?: string }).time ?? '');
  return ta.localeCompare(tb) || a.createdAt.localeCompare(b.createdAt);
};

function loadDayData(date: string): DayData {
  const records = repo.getRecordsByDate(date);
  const byCat = (id: string) => records.filter((r) => r.categoryId === id);
  return {
    date,
    bowelEvents: byCat(BUILT_IN_CATEGORY_IDS.bowel).sort(sortByTime),
    urination: byCat(BUILT_IN_CATEGORY_IDS.urination)[0] ?? null,
    sleep: byCat(BUILT_IN_CATEGORY_IDS.sleep)[0] ?? null,
    mood: byCat(BUILT_IN_CATEGORY_IDS.mood)[0] ?? null,
    anxietyEvents: byCat(BUILT_IN_CATEGORY_IDS.anxiety).sort(sortByTime),
    dailyNote: repo.getDailyNote(date),
  };
}

// app_settings keys
const KEY_BOWEL_MODE = 'bowel_record_mode';
const KEY_BOWEL_REMINDER = 'bowel_reminder_minutes';
const KEY_BOWEL_TIMER_START = 'bowel_timer_start';
const KEY_BOWEL_TIMER_NOTIF = 'bowel_timer_notif_id';

type HealthState = {
  selectedDate: string;
  day: DayData | null;
  /** 每次写库后自增，统计页据此刷新 */
  dataVersion: number;
  /** store 最近一次认定的「今天」，用于跨天检测 */
  lastKnownToday: string;
  /** 排便记录方式（timer 默认 / manual），持久化在本地设置表 */
  bowelRecordMode: BowelRecordMode;
  /** 排便计时提醒阈值（分钟） */
  bowelReminderMinutes: number;
  /** 计时开始时间（ISO），null 表示未在计时；持久化，重启 App 可恢复 */
  bowelTimerStart: string | null;
  setSelectedDate: (date: string) => void;
  /** App 回前台/页面聚焦时调用：跨天且用户正停在旧的今天，则自动跟到新的今天 */
  handleDayRollover: () => void;
  reloadDay: () => void;
  adjustUrination: (delta: number) => void;
  setUrination: (count: number, note?: string) => boolean;
  addBowelEvent: (payload: BowelPayload, note: string) => RecordEntry;
  updateBowelEvent: (id: string, payload: BowelPayload, note: string) => void;
  deleteBowelEvent: (id: string) => void;
  /** 手动编辑当日排便次数：多退（删最近）少补（加空白事件） */
  setBowelCount: (count: number) => boolean;
  setBowelRecordMode: (mode: BowelRecordMode) => void;
  setBowelReminderMinutes: (minutes: number) => void;
  startBowelTimer: () => Promise<void>;
  /** 结束计时：写入一条排便记录（归属计时开始那天），返回记录 id 供跳转补充详情 */
  finishBowelTimer: () => Promise<string | null>;
  cancelBowelTimer: () => Promise<void>;
  saveSleep: (payload: SleepPayload, note: string) => void;
  deleteSleep: () => void;
  saveMood: (payload: MoodPayload, note: string) => void;
  deleteMood: () => void;
  addAnxietyEvent: (payload: AnxietyPayload, note: string) => void;
  updateAnxietyEvent: (id: string, payload: AnxietyPayload, note: string) => void;
  deleteAnxietyEvent: (id: string) => void;
  saveDailyNote: (note: string) => void;
};

export const useHealthStore = create<HealthState>((set, get) => {
  // store 可能先于根布局被 import，确保数据库和设置表就绪
  initDatabase();

  const savedMode = repo.getSetting(KEY_BOWEL_MODE);
  const savedReminder = Number(repo.getSetting(KEY_BOWEL_REMINDER));
  const savedTimerStart = repo.getSetting(KEY_BOWEL_TIMER_START);

  const refresh = () =>
    set((s) => ({ day: loadDayData(s.selectedDate), dataVersion: s.dataVersion + 1 }));

  return {
    selectedDate: todayKey(),
    day: null,
    dataVersion: 0,
    lastKnownToday: todayKey(),
    bowelRecordMode: savedMode === 'manual' ? 'manual' : DEFAULT_BOWEL_RECORD_MODE,
    bowelReminderMinutes:
      Number.isInteger(savedReminder) && savedReminder > 0 ? savedReminder : DEFAULT_BOWEL_REMINDER_MINUTES,
    bowelTimerStart: savedTimerStart || null,

    setSelectedDate: (date) => {
      set({ selectedDate: date, day: loadDayData(date) });
    },

    handleDayRollover: () => {
      const t = todayKey();
      const { lastKnownToday, selectedDate } = get();
      if (t === lastKnownToday) return;
      const wasFollowingToday = selectedDate === lastKnownToday;
      set({ lastKnownToday: t });
      if (wasFollowingToday) {
        set({ selectedDate: t, day: loadDayData(t) });
      }
    },

    reloadDay: () => refresh(),

    adjustUrination: (delta) => {
      const { selectedDate, day } = get();
      const existing = day?.urination;
      const current = typeof existing?.value === 'number' ? existing.value : 0;
      const next = Math.max(0, Math.min(99, current + delta));
      if (existing) {
        repo.updateRecord(existing.id, { value: next, payload: { ...existing.payload, count: next } });
      } else {
        repo.insertRecord({
          categoryId: BUILT_IN_CATEGORY_IDS.urination,
          recordDate: selectedDate,
          value: next,
          payload: { count: next },
        });
      }
      refresh();
    },

    setUrination: (count, note) => {
      if (!validateCount(count).ok) return false;
      const { selectedDate, day } = get();
      const existing = day?.urination;
      if (existing) {
        repo.updateRecord(existing.id, {
          value: count,
          payload: { ...existing.payload, count },
          note: note !== undefined ? note : existing.note,
        });
      } else {
        repo.insertRecord({
          categoryId: BUILT_IN_CATEGORY_IDS.urination,
          recordDate: selectedDate,
          value: count,
          payload: { count },
          note,
        });
      }
      refresh();
      return true;
    },

    addBowelEvent: (payload, note) => {
      const { selectedDate } = get();
      const entry = repo.insertRecord({
        categoryId: BUILT_IN_CATEGORY_IDS.bowel,
        recordDate: selectedDate,
        value: 1,
        payload: { ...payload },
        note,
      });
      refresh();
      return entry;
    },

    updateBowelEvent: (id, payload, note) => {
      repo.updateRecord(id, { payload: { ...payload }, note });
      refresh();
    },

    deleteBowelEvent: (id) => {
      repo.deleteRecord(id);
      refresh();
    },

    setBowelCount: (count) => {
      if (!validateCount(count).ok) return false;
      const { selectedDate, day } = get();
      const events = day?.bowelEvents ?? [];
      if (count > events.length) {
        for (let i = events.length; i < count; i++) {
          repo.insertRecord({
            categoryId: BUILT_IN_CATEGORY_IDS.bowel,
            recordDate: selectedDate,
            value: 1,
            payload: {},
          });
        }
      } else if (count < events.length) {
        // 删除创建时间最晚的若干条（UI 层已做二次确认）
        const latestFirst = [...events].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        for (const e of latestFirst.slice(0, events.length - count)) {
          repo.deleteRecord(e.id);
        }
      }
      refresh();
      return true;
    },

    setBowelRecordMode: (mode) => {
      repo.setSetting(KEY_BOWEL_MODE, mode);
      set({ bowelRecordMode: mode });
    },

    setBowelReminderMinutes: (minutes) => {
      repo.setSetting(KEY_BOWEL_REMINDER, String(minutes));
      set({ bowelReminderMinutes: minutes });
    },

    startBowelTimer: async () => {
      if (get().bowelTimerStart) return;
      const startIso = new Date().toISOString();
      repo.setSetting(KEY_BOWEL_TIMER_START, startIso);
      set({ bowelTimerStart: startIso });
      const notifId = await scheduleBowelReminder(get().bowelReminderMinutes);
      if (notifId) repo.setSetting(KEY_BOWEL_TIMER_NOTIF, notifId);
    },

    finishBowelTimer: async () => {
      const startIso = get().bowelTimerStart;
      if (!startIso) return null;
      await cancelBowelReminder(repo.getSetting(KEY_BOWEL_TIMER_NOTIF));
      repo.deleteSetting(KEY_BOWEL_TIMER_START);
      repo.deleteSetting(KEY_BOWEL_TIMER_NOTIF);

      const start = new Date(startIso);
      const elapsedMs = Date.now() - start.getTime();
      const durationMinutes = Math.min(240, Math.max(1, Math.round(elapsedMs / 60000)));
      const pad = (n: number) => String(n).padStart(2, '0');
      const payload: BowelPayload = {
        time: `${pad(start.getHours())}:${pad(start.getMinutes())}`,
        durationMinutes,
        byTimer: true,
      };
      // 记录归属计时开始那天（跨零点时不写到第二天）
      const entry = repo.insertRecord({
        categoryId: BUILT_IN_CATEGORY_IDS.bowel,
        recordDate: toDateKey(start),
        value: 1,
        payload: { ...payload },
      });
      set({ bowelTimerStart: null });
      refresh();
      return entry.id;
    },

    cancelBowelTimer: async () => {
      if (!get().bowelTimerStart) return;
      await cancelBowelReminder(repo.getSetting(KEY_BOWEL_TIMER_NOTIF));
      repo.deleteSetting(KEY_BOWEL_TIMER_START);
      repo.deleteSetting(KEY_BOWEL_TIMER_NOTIF);
      set({ bowelTimerStart: null });
    },

    saveSleep: (payload, note) => {
      const { selectedDate, day } = get();
      if (day?.sleep) {
        repo.updateRecord(day.sleep.id, { value: payload.durationMinutes, payload: { ...payload }, note });
      } else {
        repo.insertRecord({
          categoryId: BUILT_IN_CATEGORY_IDS.sleep,
          recordDate: selectedDate,
          value: payload.durationMinutes,
          payload: { ...payload },
          note,
        });
      }
      refresh();
    },

    deleteSleep: () => {
      const { day } = get();
      if (day?.sleep) {
        repo.deleteRecord(day.sleep.id);
        refresh();
      }
    },

    saveMood: (payload, note) => {
      const { selectedDate, day } = get();
      if (day?.mood) {
        repo.updateRecord(day.mood.id, { value: payload.rating, payload: { ...payload }, note });
      } else {
        repo.insertRecord({
          categoryId: BUILT_IN_CATEGORY_IDS.mood,
          recordDate: selectedDate,
          value: payload.rating,
          payload: { ...payload },
          note,
        });
      }
      refresh();
    },

    deleteMood: () => {
      const { day } = get();
      if (day?.mood) {
        repo.deleteRecord(day.mood.id);
        refresh();
      }
    },

    addAnxietyEvent: (payload, note) => {
      const { selectedDate } = get();
      repo.insertRecord({
        categoryId: BUILT_IN_CATEGORY_IDS.anxiety,
        recordDate: selectedDate,
        payload: { ...payload },
        note,
      });
      refresh();
    },

    updateAnxietyEvent: (id, payload, note) => {
      repo.updateRecord(id, { payload: { ...payload }, note });
      refresh();
    },

    deleteAnxietyEvent: (id) => {
      repo.deleteRecord(id);
      refresh();
    },

    saveDailyNote: (note) => {
      const { selectedDate } = get();
      if (note.trim().length === 0) {
        repo.deleteDailyNote(selectedDate);
      } else {
        repo.upsertDailyNote(selectedDate, note.trim());
      }
      refresh();
    },
  };
});
