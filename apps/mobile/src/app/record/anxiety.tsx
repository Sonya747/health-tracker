import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import type { AnxietyPayload } from '@health-tracker/core';
import { formatMinutes, validateAnxiety } from '@health-tracker/core';
import { ANXIETY_DURATION_PRESETS, BUILT_IN_CATEGORY_IDS, builtInCategories, RATING_LABELS } from '@health-tracker/ui-schema';
import { DurationPickerModal, TimePickerModal } from '../../components/pickers';
import { Button, ErrorList, FieldLabel } from '../../components/ui';
import { RatingSelector, TagSelector } from '../../components/selectors';
import { useAlignedDate } from '../../stores/useAlignedDate';
import { useHealthStore } from '../../stores/useHealthStore';
import { colors, radius, spacing, typography } from '../../theme';

const anxietyCategory = builtInCategories.find((c) => c.id === BUILT_IN_CATEGORY_IDS.anxiety)!;
const triggerOptions = anxietyCategory.schema.find((f) => f.key === 'triggers')?.options ?? [];

function nowTime(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export default function AnxietyFormScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ date?: string; id?: string }>();
  const recordDate = useAlignedDate(params.date);
  const { day, addAnxietyEvent, updateAnxietyEvent, deleteAnxietyEvent } = useHealthStore();

  const existing = params.id ? (day?.anxietyEvents.find((e) => e.id === params.id) ?? null) : null;
  const p = (existing?.payload ?? {}) as Partial<AnxietyPayload>;

  const [time, setTime] = useState<string>(p.time ?? nowTime());
  const [durationMinutes, setDurationMinutes] = useState<number>(p.durationMinutes ?? 10);
  const [intensity, setIntensity] = useState<number | null>(typeof p.intensity === 'number' ? p.intensity : null);
  const [triggers, setTriggers] = useState<string[]>(p.triggers ?? []);
  const [note, setNote] = useState(existing?.note ?? '');
  const [errors, setErrors] = useState<string[]>([]);
  const [picker, setPicker] = useState<'time' | 'duration' | null>(null);

  const save = () => {
    const input = { time, durationMinutes, intensity: intensity ?? 0, triggers };
    const result = validateAnxiety(input);
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    if (existing) {
      updateAnxietyEvent(existing.id, input, note.trim());
    } else {
      addAnxietyEvent(input, note.trim());
    }
    router.back();
  };

  const remove = () => {
    if (!existing) return;
    Alert.alert('删除确认', '确定要删除这条焦虑发作记录吗？删除后无法恢复。', [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: () => {
          deleteAnxietyEvent(existing.id);
          router.back();
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={typography.secondary}>
        记录日期：{recordDate}
        {existing ? '（编辑已有记录）' : ''}
      </Text>

      <FieldLabel label="发生时间" required />
      <TouchableOpacity style={styles.pickBtn} onPress={() => setPicker('time')}>
        <Text style={styles.pickText}>{time}</Text>
      </TouchableOpacity>

      <FieldLabel label="持续时长" required />
      <TouchableOpacity style={styles.pickBtn} onPress={() => setPicker('duration')}>
        <Text style={styles.pickText}>{formatMinutes(durationMinutes)}</Text>
      </TouchableOpacity>

      <FieldLabel label="强度" required />
      <RatingSelector value={intensity} onChange={setIntensity} labels={RATING_LABELS.anxietyIntensity} />

      <FieldLabel label="诱因" />
      <TagSelector options={triggerOptions} selected={triggers} onChange={setTriggers} />

      <FieldLabel label="备注" />
      <TextInput
        style={styles.noteInput}
        value={note}
        onChangeText={setNote}
        placeholder="可选，当时的情境或感受"
        placeholderTextColor={colors.textTertiary}
        multiline
      />

      <ErrorList errors={errors} />
      <Button label="保存" onPress={save} style={{ marginTop: spacing.xl }} />
      {existing ? <Button label="删除这条记录" variant="danger" onPress={remove} style={{ marginTop: spacing.md }} /> : null}

      <TimePickerModal
        visible={picker === 'time'}
        title="发生时间"
        initial={time}
        onClose={() => setPicker(null)}
        onConfirm={(t) => {
          setTime(t);
          setPicker(null);
        }}
      />
      <DurationPickerModal
        visible={picker === 'duration'}
        title="持续时长"
        initialMinutes={durationMinutes}
        presets={ANXIETY_DURATION_PRESETS}
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
  pickBtn: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.card,
  },
  pickText: { fontSize: 15, color: colors.text },
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
