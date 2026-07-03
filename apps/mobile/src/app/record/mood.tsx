import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import type { MoodPayload } from '@health-tracker/core';
import { validateMood } from '@health-tracker/core';
import { BUILT_IN_CATEGORY_IDS, builtInCategories, RATING_LABELS } from '@health-tracker/ui-schema';
import { Button, ErrorList, FieldLabel } from '../../components/ui';
import { RatingSelector, TagSelector } from '../../components/selectors';
import { useAlignedDate } from '../../stores/useAlignedDate';
import { useHealthStore } from '../../stores/useHealthStore';
import { colors, radius, spacing, typography } from '../../theme';

const moodCategory = builtInCategories.find((c) => c.id === BUILT_IN_CATEGORY_IDS.mood)!;
const tagOptions = moodCategory.schema.find((f) => f.key === 'statusTags')?.options ?? [];

export default function MoodFormScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ date?: string }>();
  const recordDate = useAlignedDate(params.date);
  const { day, saveMood } = useHealthStore();
  const existing = day?.mood;
  const p = (existing?.payload ?? {}) as Partial<MoodPayload>;

  const [tags, setTags] = useState<string[]>(p.statusTags ?? []);
  const [rating, setRating] = useState<number | null>(typeof p.rating === 'number' ? p.rating : null);
  const [note, setNote] = useState(existing?.note ?? '');
  const [errors, setErrors] = useState<string[]>([]);

  const save = () => {
    const result = validateMood({ statusTags: tags, rating: rating ?? undefined, note });
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    saveMood({ statusTags: tags, rating: rating ?? undefined }, note.trim());
    router.back();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={typography.secondary}>记录日期：{recordDate}</Text>

      <FieldLabel label="状态标签" />
      <TagSelector options={tagOptions} selected={tags} onChange={setTags} />

      <FieldLabel label="评分" />
      <RatingSelector value={rating} onChange={setRating} labels={RATING_LABELS.moodRating} />

      <FieldLabel label="备注" />
      <TextInput
        style={styles.noteInput}
        value={note}
        onChangeText={setNote}
        placeholder="可选，今天状态怎么样？"
        placeholderTextColor={colors.textTertiary}
        multiline
      />

      <ErrorList errors={errors} />
      <Button label="保存" onPress={save} style={{ marginTop: spacing.xl }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xl * 2 },
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
