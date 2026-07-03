import { create } from 'zustand';
import type { AnxietyPayload, DailyNote, MoodPayload, RecordEntry, SleepPayload } from '@health-tracker/core';
import { todayKey, validateCount } from '@health-tracker/core';
import { BUILT_IN_CATEGORY_IDS } from '@health-tracker/ui-schema';
import * as repo from '../db/repo';

export type DayData = {
  date: string;
  bowel: RecordEntry | null;
  urination: RecordEntry | null;
  sleep: RecordEntry | null;
  mood: RecordEntry | null;
  anxietyEvents: RecordEntry[];
  dailyNote: DailyNote | null;
};

function loadDayData(date: string): DayData {
  const records = repo.getRecordsByDate(date);
  const byCat = (id: string) => records.filter((r) => r.categoryId === id);
  return {
    date,
    bowel: byCat(BUILT_IN_CATEGORY_IDS.bowel)[0] ?? null,
    urination: byCat(BUILT_IN_CATEGORY_IDS.urination)[0] ?? null,
    sleep: byCat(BUILT_IN_CATEGORY_IDS.sleep)[0] ?? null,
    mood: byCat(BUILT_IN_CATEGORY_IDS.mood)[0] ?? null,
    anxietyEvents: byCat(BUILT_IN_CATEGORY_IDS.anxiety).sort((a, b) => {
      const ta = String((a.payload as Partial<AnxietyPayload>).time ?? '');
      const tb = String((b.payload as Partial<AnxietyPayload>).time ?? '');
      return ta.localeCompare(tb);
    }),
    dailyNote: repo.getDailyNote(date),
  };
}

type CounterKind = 'bowel' | 'urination';

type HealthState = {
  selectedDate: string;
  day: DayData | null;
  /** 每次写库后自增，统计页据此刷新 */
  dataVersion: number;
  setSelectedDate: (date: string) => void;
  reloadDay: () => void;
  adjustCounter: (kind: CounterKind, delta: number) => void;
  setCounter: (kind: CounterKind, count: number, note?: string) => boolean;
  saveSleep: (payload: SleepPayload, note: string) => void;
  deleteSleep: () => void;
  saveMood: (payload: MoodPayload, note: string) => void;
  deleteMood: () => void;
  addAnxietyEvent: (payload: AnxietyPayload, note: string) => void;
  updateAnxietyEvent: (id: string, payload: AnxietyPayload, note: string) => void;
  deleteAnxietyEvent: (id: string) => void;
  saveDailyNote: (note: string) => void;
};

const counterCategoryId = (kind: CounterKind) =>
  kind === 'bowel' ? BUILT_IN_CATEGORY_IDS.bowel : BUILT_IN_CATEGORY_IDS.urination;

export const useHealthStore = create<HealthState>((set, get) => {
  const refresh = () =>
    set((s) => ({ day: loadDayData(s.selectedDate), dataVersion: s.dataVersion + 1 }));

  return {
    selectedDate: todayKey(),
    day: null,
    dataVersion: 0,

    setSelectedDate: (date) => {
      set({ selectedDate: date, day: loadDayData(date) });
    },

    reloadDay: () => refresh(),

    adjustCounter: (kind, delta) => {
      const { selectedDate, day } = get();
      const existing = kind === 'bowel' ? day?.bowel : day?.urination;
      const current = typeof existing?.value === 'number' ? existing.value : 0;
      const next = Math.max(0, Math.min(99, current + delta));
      if (existing) {
        repo.updateRecord(existing.id, { value: next, payload: { ...existing.payload, count: next } });
      } else {
        repo.insertRecord({
          categoryId: counterCategoryId(kind),
          recordDate: selectedDate,
          value: next,
          payload: { count: next },
        });
      }
      refresh();
    },

    setCounter: (kind, count, note) => {
      if (!validateCount(count).ok) return false;
      const { selectedDate, day } = get();
      const existing = kind === 'bowel' ? day?.bowel : day?.urination;
      if (existing) {
        repo.updateRecord(existing.id, {
          value: count,
          payload: { ...existing.payload, count },
          note: note !== undefined ? note : existing.note,
        });
      } else {
        repo.insertRecord({
          categoryId: counterCategoryId(kind),
          recordDate: selectedDate,
          value: count,
          payload: { count },
          note,
        });
      }
      refresh();
      return true;
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
