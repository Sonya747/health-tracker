import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import type { SleepPayload } from '@health-tracker/core';
import { durationFromTimes, formatMinutes, validateSleep } from '@health-tracker/core';
import {
  AWAKE_DURATION_PRESETS,
  BUILT_IN_CATEGORY_IDS,
  builtInCategories,
  RATING_LABELS,
  SLEEP_DURATION_PRESETS,
} from '@health-tracker/ui-schema';
import { DurationPickerModal, TimePickerModal } from '../../components/pickers';
import { Button, ErrorList, FieldLabel } from '../../components/ui';
import { RatingSelector, TagSelector } from '../../components/selectors';
import { useAlignedDate } from '../../stores/useAlignedDate';
import { useHealthStore } from '../../stores/useHealthStore';
import { colors, radius, spacing, typography } from '../../theme';

const sleepCategory = builtInCategories.find((c) => c.id === BUILT_IN_CATEGORY_IDS.sleep)!;
const sleepTagOptions = sleepCategory.schema.find((f) => f.key === 'sleepTags')?.options ?? [];

export default function SleepFormScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ date?: string }>();
  const recordDate = useAlignedDate(params.date);
  const { day, saveSleep } = useHealthStore();
  const existing = day?.sleep;
  const p = (existing?.payload ?? {}) as Partial<SleepPayload>;

  const [startTime, setStartTime] = useState<string | undefined>(p.startTime);
  const [endTime, setEndTime] = useState<string | undefined>(p.endTime);
  const [durationMinutes, setDurationMinutes] = useState<number | undefined>(p.durationMinutes);
  const [quality, setQuality] = useState<number | null>(typeof p.quality === 'number' ? p.quality : null);
  const [awakeCount, setAwakeCount] = useState<number | undefined>(p.awakeCount);
  const [awakeMinutes, setAwakeMinutes] = useState<number | undefined>(p.awakeMinutes);
  const [deepSleepDraft, setDeepSleepDraft] = useState(
    typeof p.deepSleepPercent === 'number' ? String(p.deepSleepPercent) : '',
  );
  const [sleepTags, setSleepTags] = useState<string[]>(p.sleepTags ?? []);
  const [note, setNote] = useState(existing?.note ?? '');
  const [errors, setErrors] = useState<string[]>([]);
  const [picker, setPicker] = useState<'start' | 'end' | 'duration' | 'awake' | null>(null);

  // 起止时间齐了自动算时长
  const effectiveDuration =
    startTime && endTime ? durationFromTimes(startTime, endTime) : durationMinutes;

  const save = () => {
    const trimmedDeep = deepSleepDraft.trim();
    if (trimmedDeep !== '' && !/^\d+(\.\d+)?$/.test(trimmedDeep)) {
      setErrors(['深睡比例请输入 0-100 的数字']);
      return;
    }
    const deepSleepPercent = trimmedDeep === '' ? undefined : Number(trimmedDeep);
    const input = {
      startTime,
      endTime,
      durationMinutes: effectiveDuration,
      quality: quality ?? undefined,
      awakeCount,
      awakeMinutes,
      deepSleepPercent,
      sleepTags,
    };
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
        awakeCount,
        awakeMinutes,
        deepSleepPercent,
        sleepTags,
      },
      note.trim(),
    );
    router.back();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={typography.secondary}>记录日期：{recordDate}</Text>

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

      <FieldLabel label="夜间清醒次数" />
      <View style={styles.stepperRow}>
        <TouchableOpacity
          style={[styles.stepperBtn, (awakeCount ?? 0) <= 0 && styles.stepperBtnDisabled]}
          onPress={() => setAwakeCount(Math.max(0, (awakeCount ?? 0) - 1))}
          disabled={(awakeCount ?? 0) <= 0}
        >
          <Text style={styles.stepperBtnText}>−</Text>
        </TouchableOpacity>
        <Text style={styles.stepperValue}>{awakeCount === undefined ? '未记录' : `${awakeCount} 次`}</Text>
        <TouchableOpacity
          style={styles.stepperBtn}
          onPress={() => setAwakeCount(Math.min(99, (awakeCount ?? 0) + 1))}
        >
          <Text style={styles.stepperBtnText}>＋</Text>
        </TouchableOpacity>
        {awakeCount !== undefined ? (
          <TouchableOpacity onPress={() => setAwakeCount(undefined)}>
            <Text style={styles.clearText}>清除</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <FieldLabel label="夜间清醒时长" />
      <View style={styles.row}>
        <TouchableOpacity style={styles.timeBtn} onPress={() => setPicker('awake')}>
          <Text style={awakeMinutes !== undefined ? styles.timeText : styles.timePlaceholder}>
            {awakeMinutes !== undefined ? formatMinutes(awakeMinutes) : '选择时长'}
          </Text>
        </TouchableOpacity>
        {awakeMinutes !== undefined ? (
          <TouchableOpacity onPress={() => setAwakeMinutes(undefined)}>
            <Text style={styles.clearText}>清除</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <FieldLabel label="深睡比例（%）" />
      <View style={styles.row}>
        <TextInput
          style={[styles.timeBtn, styles.percentInput]}
          value={deepSleepDraft}
          onChangeText={setDeepSleepDraft}
          keyboardType="decimal-pad"
          maxLength={5}
          placeholder="0-100，可选"
          placeholderTextColor={colors.textTertiary}
        />
        <Text style={styles.unitText}>%</Text>
      </View>

      <FieldLabel label="睡眠标签" />
      <TagSelector options={sleepTagOptions} selected={sleepTags} onChange={setSleepTags} />

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
      <DurationPickerModal
        visible={picker === 'awake'}
        title="夜间清醒时长"
        initialMinutes={awakeMinutes}
        presets={AWAKE_DURATION_PRESETS}
        onClose={() => setPicker(null)}
        onConfirm={(m) => {
          setAwakeMinutes(m);
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
  stepperRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  stepperBtn: {
    width: 44,
    height: 40,
    borderRadius: radius.sm,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperBtnDisabled: { backgroundColor: colors.background },
  stepperBtnText: { fontSize: 20, color: colors.primary, fontWeight: '600' },
  stepperValue: { fontSize: 15, color: colors.text, minWidth: 64, textAlign: 'center' },
  percentInput: { fontSize: 15, color: colors.text, paddingVertical: 10 },
  unitText: { fontSize: 15, color: colors.textSecondary },
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
