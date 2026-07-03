import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import {
  addDays,
  formatMinutes,
  monthRangeOf,
  parseDateKey,
  toDateKey,
  todayKey,
} from '@health-tracker/core';
import { colors, radius, spacing } from '../theme';
import { Button, ModalSheet } from './ui';

const pad = (n: number) => String(n).padStart(2, '0');

/** 时间选择：小时 + 分钟两列 */
export function TimePickerModal({
  visible,
  title,
  initial,
  onConfirm,
  onClose,
}: {
  visible: boolean;
  title: string;
  initial?: string;
  onConfirm: (time: string) => void;
  onClose: () => void;
}) {
  const [initH, initM] = (initial && /^\d{2}:\d{2}$/.test(initial) ? initial : '22:00')
    .split(':')
    .map(Number);
  const [hour, setHour] = useState(initH);
  const [minute, setMinute] = useState(initM);

  return (
    <ModalSheet visible={visible} onClose={onClose} title={title}>
      <View style={styles.timeColumns}>
        <ScrollView style={styles.timeColumn} showsVerticalScrollIndicator={false}>
          {Array.from({ length: 24 }, (_, h) => (
            <TouchableOpacity
              key={h}
              style={[styles.timeItem, hour === h && styles.timeItemActive]}
              onPress={() => setHour(h)}
            >
              <Text style={[styles.timeText, hour === h && styles.timeTextActive]}>{pad(h)} 时</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <ScrollView style={styles.timeColumn} showsVerticalScrollIndicator={false}>
          {Array.from({ length: 60 }, (_, m) => m).map((m) => (
            <TouchableOpacity
              key={m}
              style={[styles.timeItem, minute === m && styles.timeItemActive]}
              onPress={() => setMinute(m)}
            >
              <Text style={[styles.timeText, minute === m && styles.timeTextActive]}>{pad(m)} 分</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      <Button label={`确定 ${pad(hour)}:${pad(minute)}`} onPress={() => onConfirm(`${pad(hour)}:${pad(minute)}`)} />
    </ModalSheet>
  );
}

/** 时长选择：快捷选项 + 小时/分钟微调 */
export function DurationPickerModal({
  visible,
  title,
  initialMinutes,
  presets,
  onConfirm,
  onClose,
}: {
  visible: boolean;
  title: string;
  initialMinutes?: number;
  presets: number[];
  onConfirm: (minutes: number) => void;
  onClose: () => void;
}) {
  const [minutes, setMinutes] = useState(initialMinutes && initialMinutes > 0 ? initialMinutes : presets[0] ?? 30);

  const adjust = (delta: number) => setMinutes((m) => Math.max(1, Math.min(24 * 60, m + delta)));

  return (
    <ModalSheet visible={visible} onClose={onClose} title={title}>
      <View style={styles.presetWrap}>
        {presets.map((p) => (
          <TouchableOpacity
            key={p}
            style={[styles.preset, minutes === p && styles.presetActive]}
            onPress={() => setMinutes(p)}
          >
            <Text style={[styles.presetText, minutes === p && styles.presetTextActive]}>
              {formatMinutes(p)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.adjustRow}>
        {[
          { label: '-1时', delta: -60 },
          { label: '-5分', delta: -5 },
          { label: '+5分', delta: 5 },
          { label: '+1时', delta: 60 },
        ].map((a) => (
          <TouchableOpacity key={a.label} style={styles.adjustBtn} onPress={() => adjust(a.delta)}>
            <Text style={styles.adjustText}>{a.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <Text style={styles.durationPreview}>{formatMinutes(minutes)}</Text>
      <Button label="确定" onPress={() => onConfirm(minutes)} />
    </ModalSheet>
  );
}

/** 月历日期选择 */
export function CalendarModal({
  visible,
  initial,
  onConfirm,
  onClose,
}: {
  visible: boolean;
  initial: string;
  onConfirm: (date: string) => void;
  onClose: () => void;
}) {
  const [anchor, setAnchor] = useState(initial);
  // Modal 常驻不卸载：每次打开都回到当前选中日期所在的月份
  useEffect(() => {
    if (visible) setAnchor(initial);
  }, [visible, initial]);
  const range = monthRangeOf(anchor);
  const first = parseDateKey(range.start);
  const year = first.getFullYear();
  const month = first.getMonth();
  const daysInMonth = parseDateKey(range.end).getDate();
  const leadingBlanks = (first.getDay() + 6) % 7; // 周一开头
  const today = todayKey();

  const cells: (string | null)[] = [
    ...Array.from({ length: leadingBlanks }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => toDateKey(new Date(year, month, i + 1))),
  ];

  const shiftMonth = (delta: number) => {
    setAnchor(toDateKey(new Date(year, month + delta, 1)));
  };

  return (
    <ModalSheet visible={visible} onClose={onClose}>
      <View style={styles.calHeader}>
        <TouchableOpacity onPress={() => shiftMonth(-1)} style={styles.calNav}>
          <Text style={styles.calNavText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.calTitle}>
          {year}年{month + 1}月
        </Text>
        <TouchableOpacity onPress={() => shiftMonth(1)} style={styles.calNav}>
          <Text style={styles.calNavText}>›</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.calWeekRow}>
        {['一', '二', '三', '四', '五', '六', '日'].map((w) => (
          <Text key={w} style={styles.calWeekday}>
            {w}
          </Text>
        ))}
      </View>
      <View style={styles.calGrid}>
        {cells.map((date, i) => (
          <View key={i} style={styles.calCell}>
            {date ? (
              <TouchableOpacity
                style={[styles.calDay, date === today && styles.calDayToday, date === initial && styles.calDaySelected]}
                onPress={() => onConfirm(date)}
              >
                <Text
                  style={[
                    styles.calDayText,
                    date === today && { color: colors.primary, fontWeight: '700' },
                    date === initial && { color: '#fff', fontWeight: '700' },
                  ]}
                >
                  {parseDateKey(date).getDate()}
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>
        ))}
      </View>
      <Button label="回到今天" variant="secondary" onPress={() => onConfirm(today)} style={{ marginTop: spacing.md }} />
    </ModalSheet>
  );
}

/** 日期左右切换 + 打开日历 */
export function DateSwitcher({
  date,
  onChange,
}: {
  date: string;
  onChange: (date: string) => void;
}) {
  const [calendarVisible, setCalendarVisible] = useState(false);
  const isToday = date === todayKey();
  return (
    <View style={styles.switcherRow}>
      <TouchableOpacity style={styles.switcherArrow} onPress={() => onChange(addDays(date, -1))}>
        <Text style={styles.switcherArrowText}>‹</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.switcherCenter} onPress={() => setCalendarVisible(true)}>
        <Text style={styles.switcherDate}>
          {date}
          {isToday ? '（今天）' : ''}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.switcherArrow} onPress={() => onChange(addDays(date, 1))}>
        <Text style={styles.switcherArrowText}>›</Text>
      </TouchableOpacity>
      <CalendarModal
        visible={calendarVisible}
        initial={date}
        onClose={() => setCalendarVisible(false)}
        onConfirm={(d) => {
          setCalendarVisible(false);
          onChange(d);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  timeColumns: { flexDirection: 'row', gap: spacing.md, height: 240, marginBottom: spacing.lg },
  timeColumn: { flex: 1 },
  timeItem: {
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: radius.sm,
  },
  timeItemActive: { backgroundColor: colors.primarySoft },
  timeText: { fontSize: 15, color: colors.textSecondary },
  timeTextActive: { color: colors.primary, fontWeight: '700' },
  presetWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg },
  preset: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
  },
  presetActive: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  presetText: { fontSize: 13, color: colors.textSecondary },
  presetTextActive: { color: colors.primary, fontWeight: '600' },
  adjustRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  adjustBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  adjustText: { fontSize: 14, color: colors.text },
  durationPreview: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  calHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  calNav: { padding: spacing.sm, paddingHorizontal: spacing.lg },
  calNavText: { fontSize: 24, color: colors.primary },
  calTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  calWeekRow: { flexDirection: 'row', marginBottom: spacing.xs },
  calWeekday: { flex: 1, textAlign: 'center', fontSize: 12, color: colors.textTertiary },
  calGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calCell: { width: `${100 / 7}%`, alignItems: 'center', paddingVertical: 3 },
  calDay: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calDayToday: { borderWidth: 1, borderColor: colors.primary },
  calDaySelected: { backgroundColor: colors.primary },
  calDayText: { fontSize: 15, color: colors.text },
  switcherRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  switcherArrow: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  switcherArrowText: { fontSize: 26, color: colors.primary, fontWeight: '600' },
  switcherCenter: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  switcherDate: { fontSize: 16, fontWeight: '600', color: colors.text },
});
