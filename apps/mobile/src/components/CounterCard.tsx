import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { validateCount } from '@health-tracker/core';
import { colors, radius, spacing } from '../theme';
import { Button, Card, CardHeader, ErrorList, FieldLabel, ModalSheet } from './ui';

/** 计数卡片：加一 / 减一 / 点数字手动编辑（含清零、备注） */
export function CounterCard({
  icon,
  title,
  count,
  note,
  onAdjust,
  onManualSave,
}: {
  icon: string;
  title: string;
  count: number;
  note?: string;
  onAdjust: (delta: number) => void;
  onManualSave: (count: number, note: string) => boolean;
}) {
  const [editVisible, setEditVisible] = useState(false);
  const [draftCount, setDraftCount] = useState(String(count));
  const [draftNote, setDraftNote] = useState(note ?? '');
  const [errors, setErrors] = useState<string[]>([]);

  const openEdit = () => {
    setDraftCount(String(count));
    setDraftNote(note ?? '');
    setErrors([]);
    setEditVisible(true);
  };

  const save = () => {
    if (draftCount.trim() === '') {
      setErrors(['请输入次数（清零请点「清零」按钮）']);
      return;
    }
    const n = Number(draftCount);
    const result = validateCount(n);
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    if (onManualSave(n, draftNote.trim())) {
      setEditVisible(false);
    }
  };

  return (
    <Card>
      <CardHeader
        icon={icon}
        title={title}
        right={
          <TouchableOpacity onPress={openEdit}>
            <Text style={styles.editLink}>编辑</Text>
          </TouchableOpacity>
        }
      />
      <View style={styles.row}>
        <TouchableOpacity
          style={[styles.adjustBtn, count <= 0 && styles.adjustBtnDisabled]}
          onPress={() => onAdjust(-1)}
          disabled={count <= 0}
          accessibilityLabel={`${title}减一`}
        >
          <Text style={[styles.adjustBtnText, count <= 0 && { color: colors.textTertiary }]}>−</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.countBox} onPress={openEdit}>
          <Text style={styles.count}>{count}</Text>
          <Text style={styles.unit}>次</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.adjustBtn}
          onPress={() => onAdjust(1)}
          accessibilityLabel={`${title}加一`}
        >
          <Text style={styles.adjustBtnText}>＋</Text>
        </TouchableOpacity>
      </View>
      {note ? <Text style={styles.note}>备注：{note}</Text> : null}

      <ModalSheet visible={editVisible} onClose={() => setEditVisible(false)} title={`编辑${title}次数`}>
        <FieldLabel label="次数" required />
        <TextInput
          style={styles.input}
          value={draftCount}
          onChangeText={setDraftCount}
          keyboardType="number-pad"
          maxLength={2}
        />
        <FieldLabel label="备注" />
        <TextInput
          style={[styles.input, styles.noteInput]}
          value={draftNote}
          onChangeText={setDraftNote}
          placeholder="可选"
          placeholderTextColor={colors.textTertiary}
          multiline
        />
        <ErrorList errors={errors} />
        <View style={styles.modalActions}>
          <Button label="清零" variant="danger" onPress={() => setDraftCount('0')} style={{ flex: 1 }} />
          <Button label="保存" onPress={save} style={{ flex: 2 }} />
        </View>
      </ModalSheet>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  adjustBtn: {
    width: 56,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  adjustBtnDisabled: { backgroundColor: colors.background },
  adjustBtnText: { fontSize: 26, color: colors.primary, fontWeight: '600', lineHeight: 30 },
  countBox: { flexDirection: 'row', alignItems: 'baseline', gap: 4, paddingHorizontal: spacing.lg },
  count: { fontSize: 34, fontWeight: '700', color: colors.text },
  unit: { fontSize: 13, color: colors.textSecondary },
  note: { fontSize: 13, color: colors.textSecondary, marginTop: spacing.sm },
  editLink: { fontSize: 14, color: colors.primary },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    fontSize: 16,
    color: colors.text,
  },
  noteInput: { minHeight: 64, textAlignVertical: 'top' },
  modalActions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xl },
});
