import React, { useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import type { BowelPayload } from '@health-tracker/core';
import { formatMinutes, validateBowelEvent } from '@health-tracker/core';
import { BOWEL_DURATION_PRESETS, BUILT_IN_CATEGORY_IDS, builtInCategories } from '@health-tracker/ui-schema';
import { DurationPickerModal, TimePickerModal } from '../../components/pickers';
import { Button, ErrorList, FieldLabel } from '../../components/ui';
import { TagSelector } from '../../components/selectors';
import * as repo from '../../db/repo';
import { useAlignedDate } from '../../stores/useAlignedDate';
import { useHealthStore } from '../../stores/useHealthStore';
import { colors, radius, spacing, typography } from '../../theme';

const bowelCategory = builtInCategories.find((c) => c.id === BUILT_IN_CATEGORY_IDS.bowel)!;
const stoolTagOptions = bowelCategory.schema.find((f) => f.key === 'stoolTags')?.options ?? [];

function nowTime(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export default function BowelFormScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ date?: string; id?: string }>();
  const alignedDate = useAlignedDate(params.date);
  const { addBowelEvent, updateBowelEvent, deleteBowelEvent } = useHealthStore();

  // 编辑模式直接按 id 读库（计时跨零点时记录可能不在当前选中日期）
  const existing = useMemo(() => (params.id ? repo.getRecordById(params.id) : null), [params.id]);
  const p = (existing?.payload ?? {}) as Partial<BowelPayload>;
  const recordDate = existing?.recordDate ?? alignedDate;

  const [time, setTime] = useState<string>(p.time ?? nowTime());
  const [durationMinutes, setDurationMinutes] = useState<number | undefined>(p.durationMinutes);
  const [stoolTags, setStoolTags] = useState<string[]>(p.stoolTags ?? []);
  const [note, setNote] = useState(existing?.note ?? '');
  const [errors, setErrors] = useState<string[]>([]);
  const [picker, setPicker] = useState<'time' | 'duration' | null>(null);

  const save = () => {
    const input = { time, durationMinutes, stoolTags };
    const result = validateBowelEvent(input);
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    const payload: BowelPayload = {
      time,
      durationMinutes,
      stoolTags,
      ...(p.byTimer ? { byTimer: true } : {}),
    };
    if (existing) {
      updateBowelEvent(existing.id, payload, note.trim());
    } else {
      addBowelEvent(payload, note.trim());
    }
    router.back();
  };

  const remove = () => {
    if (!existing) return;
    Alert.alert('删除确认', '确定要删除这条排便记录吗？删除后无法恢复。', [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: () => {
          deleteBowelEvent(existing.id);
          router.back();
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={typography.secondary}>
        记录日期：{recordDate}
        {existing ? (p.byTimer ? '（计时记录）' : '（编辑已有记录）') : ''}
      </Text>

      <FieldLabel label="发生时间" />
      <TouchableOpacity style={styles.pickBtn} onPress={() => setPicker('time')}>
        <Text style={styles.pickText}>{time}</Text>
      </TouchableOpacity>

      <FieldLabel label="时长" />
      <View style={styles.row}>
        <TouchableOpacity style={[styles.pickBtn, { flex: 1 }]} onPress={() => setPicker('duration')}>
          <Text style={durationMinutes !== undefined ? styles.pickText : styles.pickPlaceholder}>
            {durationMinutes !== undefined ? formatMinutes(durationMinutes) : '选择时长（可选）'}
          </Text>
        </TouchableOpacity>
        {durationMinutes !== undefined ? (
          <TouchableOpacity onPress={() => setDurationMinutes(undefined)}>
            <Text style={styles.clearText}>清除</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <FieldLabel label="大便状态" />
      <TagSelector options={stoolTagOptions} selected={stoolTags} onChange={setStoolTags} />

      <FieldLabel label="备注" />
      <TextInput
        style={styles.noteInput}
        value={note}
        onChangeText={setNote}
        placeholder="可选"
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
        title="排便时长"
        initialMinutes={durationMinutes}
        presets={BOWEL_DURATION_PRESETS}
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
  pickBtn: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.card,
  },
  pickText: { fontSize: 15, color: colors.text },
  pickPlaceholder: { fontSize: 15, color: colors.textTertiary },
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
