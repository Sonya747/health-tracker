import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import type { SleepPayload } from '@health-tracker/core';
import { durationFromTimes, formatMinutes, validateSleep } from '@health-tracker/core';
import { RATING_LABELS, SLEEP_DURATION_PRESETS } from '@health-tracker/ui-schema';
import { DurationPickerModal, TimePickerModal } from '../../components/pickers';
import { Button, ErrorList, FieldLabel } from '../../components/ui';
import { RatingSelector } from '../../components/selectors';
import { useHealthStore } from '../../stores/useHealthStore';
import { colors, radius, spacing, typography } from '../../theme';

export default function SleepFormScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ date?: string }>();
  const { day, saveSleep } = useHealthStore();
  const existing = day?.sleep;
  const p = (existing?.payload ?? {}) as Partial<SleepPayload>;

  const [startTime, setStartTime] = useState<string | undefined>(p.startTime);
  const [endTime, setEndTime] = useState<string | undefined>(p.endTime);
  const [durationMinutes, setDurationMinutes] = useState<number | undefined>(p.durationMinutes);
  const [quality, setQuality] = useState<number | null>(typeof p.quality === 'number' ? p.quality : null);
  const [note, setNote] = useState(existing?.note ?? '');
  const [errors, setErrors] = useState<string[]>([]);
  const [picker, setPicker] = useState<'start' | 'end' | 'duration' | null>(null);

  // 起止时间齐了自动算时长
  const effectiveDuration =
    startTime && endTime ? durationFromTimes(startTime, endTime) : durationMinutes;

  const save = () => {
    const input = { startTime, endTime, durationMinutes: effectiveDuration, quality: quality ?? undefined };
    const result = validateSleep(input);
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    saveSleep(
      {
        startTime,
        endTime,
        durationMinutes: effectiveDuration!,
        quality: quality ?? undefined,
      },
      note.trim(),
    );
    router.back();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={typography.secondary}>记录日期：{params.date ?? day?.date}</Text>

      <FieldLabel label="开始时间" />
      <View style={styles.row}>
        <TouchableOpacity style={styles.timeBtn} onPress={() => setPicker('start')}>
          <Text style={startTime ? styles.timeText : styles.timePlaceholder}>{startTime ?? '选择时间'}</Text>
        </TouchableOpacity>
        {startTime ? (
          <TouchableOpacity onPress={() => setStartTime(undefined)}>
            <Text style={styles.clearText}>清除</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <FieldLabel label="结束时间" />
      <View style={styles.row}>
        <TouchableOpacity style={styles.timeBtn} onPress={() => setPicker('end')}>
          <Text style={endTime ? styles.timeText : styles.timePlaceholder}>{endTime ?? '选择时间'}</Text>
        </TouchableOpacity>
        {endTime ? (
          <TouchableOpacity onPress={() => setEndTime(undefined)}>
            <Text style={styles.clearText}>清除</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <FieldLabel label="睡眠时长（不填起止时间时可直接选）" />
      <TouchableOpacity
        style={[styles.timeBtn, startTime && endTime ? styles.timeBtnDisabled : null]}
        onPress={() => setPicker('duration')}
        disabled={!!(startTime && endTime)}
      >
        <Text style={effectiveDuration ? styles.timeText : styles.timePlaceholder}>
          {effectiveDuration
            ? `${formatMinutes(effectiveDuration)}${startTime && endTime ? '（由起止时间计算）' : ''}`
            : '选择时长'}
        </Text>
      </TouchableOpacity>

      <FieldLabel label="睡眠质量" />
      <RatingSelector value={quality} onChange={setQuality} labels={RATING_LABELS.sleepQuality} />

      <FieldLabel label="备注" />
      <TextInput
        style={styles.noteInput}
        value={note}
        onChangeText={setNote}
        placeholder="可选，例如夜里醒了两次"
        placeholderTextColor={colors.textTertiary}
        multiline
      />

      <ErrorList errors={errors} />
      <Button label="保存" onPress={save} style={{ marginTop: spacing.xl }} />

      <TimePickerModal
        visible={picker === 'start'}
        title="开始时间"
        initial={startTime ?? '23:00'}
        onClose={() => setPicker(null)}
        onConfirm={(t) => {
          setStartTime(t);
          setPicker(null);
        }}
      />
      <TimePickerModal
        visible={picker === 'end'}
        title="结束时间"
        initial={endTime ?? '07:00'}
        onClose={() => setPicker(null)}
        onConfirm={(t) => {
          setEndTime(t);
          setPicker(null);
        }}
      />
      <DurationPickerModal
        visible={picker === 'duration'}
        title="睡眠时长"
        initialMinutes={durationMinutes}
        presets={SLEEP_DURATION_PRESETS}
        onClose={() => setPicker(null)}
        onConfirm={(m) => {
          setDurationMinutes(m);
          setPicker(null);
        }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xl * 2 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  timeBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.card,
  },
  timeBtnDisabled: { opacity: 0.6 },
  timeText: { fontSize: 15, color: colors.text },
  timePlaceholder: { fontSize: 15, color: colors.textTertiary },
  clearText: { fontSize: 13, color: colors.textSecondary },
  noteInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    padding: spacing.md,
    minHeight: 72,
    textAlignVertical: 'top',
    fontSize: 14,
    color: colors.text,
    backgroundColor: colors.card,
  },
});
