import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { colors, radius, spacing } from '../theme';

/** 1-5 评分选择，labels 下标 0-4 对应 1-5 分 */
export function RatingSelector({
  value,
  onChange,
  labels,
}: {
  value: number | null;
  onChange: (v: number) => void;
  labels?: string[];
}) {
  return (
    <View style={styles.ratingRow}>
      {[1, 2, 3, 4, 5].map((n) => {
        const active = value === n;
        return (
          <TouchableOpacity
            key={n}
            style={[styles.ratingItem, active && styles.ratingItemActive]}
            onPress={() => onChange(n)}
          >
            <Text style={[styles.ratingNum, active && styles.ratingNumActive]}>{n}</Text>
            {labels?.[n - 1] ? (
              <Text style={[styles.ratingLabel, active && styles.ratingLabelActive]}>{labels[n - 1]}</Text>
            ) : null}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

/** 多选标签 + 自定义标签输入 */
export function TagSelector({
  options,
  selected,
  onChange,
  allowCustom = true,
}: {
  options: string[];
  selected: string[];
  onChange: (tags: string[]) => void;
  allowCustom?: boolean;
}) {
  const [custom, setCustom] = useState('');
  const allOptions = [...options, ...selected.filter((t) => !options.includes(t))];

  const toggle = (tag: string) => {
    onChange(selected.includes(tag) ? selected.filter((t) => t !== tag) : [...selected, tag]);
  };

  const addCustom = () => {
    const tag = custom.trim();
    if (tag && !selected.includes(tag)) {
      onChange([...selected, tag]);
    }
    setCustom('');
  };

  return (
    <View>
      <View style={styles.tagWrap}>
        {allOptions.map((tag) => {
          const active = selected.includes(tag);
          return (
            <TouchableOpacity
              key={tag}
              style={[styles.tag, active && styles.tagActive]}
              onPress={() => toggle(tag)}
            >
              <Text style={[styles.tagText, active && styles.tagTextActive]}>{tag}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
      {allowCustom ? (
        <View style={styles.customRow}>
          <TextInput
            style={styles.customInput}
            value={custom}
            onChangeText={setCustom}
            placeholder="自定义标签"
            placeholderTextColor={colors.textTertiary}
            onSubmitEditing={addCustom}
            returnKeyType="done"
          />
          <TouchableOpacity style={styles.customAdd} onPress={addCustom}>
            <Text style={{ color: colors.primary, fontWeight: '600' }}>添加</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  ratingRow: { flexDirection: 'row', gap: spacing.sm },
  ratingItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  ratingItemActive: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  ratingNum: { fontSize: 16, fontWeight: '600', color: colors.textSecondary },
  ratingNumActive: { color: colors.primary },
  ratingLabel: { fontSize: 11, color: colors.textTertiary, marginTop: 2 },
  ratingLabelActive: { color: colors.primary },
  tagWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  tag: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  tagActive: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  tagText: { fontSize: 13, color: colors.textSecondary },
  tagTextActive: { color: colors.primary, fontWeight: '600' },
  customRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md, alignItems: 'center' },
  customInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    fontSize: 14,
    color: colors.text,
  },
  customAdd: { paddingHorizontal: spacing.sm, paddingVertical: 8 },
});
