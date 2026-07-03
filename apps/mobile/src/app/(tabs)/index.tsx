import React, { useEffect, useState } from 'react';
import { Alert, AppState, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import type { AnxietyPayload, MoodPayload, SleepPayload } from '@health-tracker/core';
import { formatDateKey, formatMinutes } from '@health-tracker/core';
import { RATING_LABELS } from '@health-tracker/ui-schema';
import { CounterCard } from '../../components/CounterCard';
import { DateSwitcher } from '../../components/pickers';
import { Button, Card, CardHeader, EmptyState } from '../../components/ui';
import { useHealthStore } from '../../stores/useHealthStore';
import { colors, radius, spacing, typography } from '../../theme';

export default function TodayScreen() {
  const router = useRouter();
  const {
    selectedDate,
    day,
    setSelectedDate,
    reloadDay,
    adjustCounter,
    setCounter,
    deleteSleep,
    deleteMood,
    deleteAnxietyEvent,
    saveDailyNote,
    handleDayRollover,
  } = useHealthStore();

  const [noteDraft, setNoteDraft] = useState('');
  const [noteDirty, setNoteDirty] = useState(false);

  // 首次进入加载当天数据
  useEffect(() => {
    if (!day) reloadDay();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // App 从后台回到前台时检测跨天（例如过夜后第二天早上打开）
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') handleDayRollover();
    });
    return () => sub.remove();
  }, [handleDayRollover]);

  // 切换日期后同步备注草稿
  useEffect(() => {
    setNoteDraft(day?.dailyNote?.note ?? '');
    setNoteDirty(false);
  }, [day?.dailyNote?.note, selectedDate]);

  if (!day) return null;

  const bowelCount = typeof day.bowel?.value === 'number' ? day.bowel.value : 0;
  const urinationCount = typeof day.urination?.value === 'number' ? day.urination.value : 0;
  const sleep = day.sleep;
  const sleepPayload = sleep?.payload as Partial<SleepPayload> | undefined;
  const mood = day.mood;
  const moodPayload = mood?.payload as Partial<MoodPayload> | undefined;

  const confirmDelete = (what: string, action: () => void) => {
    Alert.alert('删除确认', `确定要删除${what}吗？删除后无法恢复。`, [
      { text: '取消', style: 'cancel' },
      { text: '删除', style: 'destructive', onPress: action },
    ]);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <DateSwitcher date={selectedDate} onChange={setSelectedDate} />
      <Text style={styles.dateLabel}>{formatDateKey(selectedDate)}</Text>

      <CounterCard
        icon="💩"
        title="排便"
        count={bowelCount}
        note={day.bowel?.note}
        onAdjust={(d) => adjustCounter('bowel', d)}
        onManualSave={(c, n) => setCounter('bowel', c, n)}
      />
      <CounterCard
        icon="💧"
        title="排尿"
        count={urinationCount}
        note={day.urination?.note}
        onAdjust={(d) => adjustCounter('urination', d)}
        onManualSave={(c, n) => setCounter('urination', c, n)}
      />

      {/* 睡眠 */}
      <Card>
        <CardHeader
          icon="😴"
          title="睡眠"
          right={
            sleep ? (
              <View style={styles.headerActions}>
                <TouchableOpacity onPress={() => router.push(`/record/sleep?date=${selectedDate}`)}>
                  <Text style={styles.link}>编辑</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => confirmDelete('这条睡眠记录', deleteSleep)}>
                  <Text style={[styles.link, { color: colors.danger }]}>删除</Text>
                </TouchableOpacity>
              </View>
            ) : undefined
          }
        />
        {sleep && sleepPayload ? (
          <View>
            <Text style={styles.bigValue}>{formatMinutes(sleepPayload.durationMinutes ?? 0)}</Text>
            <Text style={typography.secondary}>
              {sleepPayload.startTime && sleepPayload.endTime
                ? `${sleepPayload.startTime} - ${sleepPayload.endTime}`
                : '未填写起止时间'}
              {typeof sleepPayload.quality === 'number'
                ? ` · 质量：${RATING_LABELS.sleepQuality[sleepPayload.quality - 1]}`
                : ''}
            </Text>
            {sleep.note ? <Text style={styles.noteText}>备注：{sleep.note}</Text> : null}
          </View>
        ) : (
          <View>
            <EmptyState icon="🌙" text="还没有睡眠记录" hint="记录时长或起止时间、睡眠质量" />
            <Button label="记录睡眠" variant="secondary" onPress={() => router.push(`/record/sleep?date=${selectedDate}`)} />
          </View>
        )}
      </Card>

      {/* 个人状态 */}
      <Card>
        <CardHeader
          icon="🙂"
          title="个人状态"
          right={
            mood ? (
              <View style={styles.headerActions}>
                <TouchableOpacity onPress={() => router.push(`/record/mood?date=${selectedDate}`)}>
                  <Text style={styles.link}>编辑</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => confirmDelete('这条状态记录', deleteMood)}>
                  <Text style={[styles.link, { color: colors.danger }]}>删除</Text>
                </TouchableOpacity>
              </View>
            ) : undefined
          }
        />
        {mood && moodPayload ? (
          <View>
            {typeof moodPayload.rating === 'number' ? (
              <Text style={styles.bigValue}>
                {moodPayload.rating} 分 · {RATING_LABELS.moodRating[moodPayload.rating - 1]}
              </Text>
            ) : null}
            {(moodPayload.statusTags?.length ?? 0) > 0 ? (
              <View style={styles.tagRow}>
                {moodPayload.statusTags!.map((t) => (
                  <View key={t} style={styles.tagChip}>
                    <Text style={styles.tagChipText}>{t}</Text>
                  </View>
                ))}
              </View>
            ) : null}
            {mood.note ? <Text style={styles.noteText}>备注：{mood.note}</Text> : null}
          </View>
        ) : (
          <View>
            <EmptyState icon="💭" text="还没有状态记录" hint="选择状态标签、打分或写备注" />
            <Button label="记录状态" variant="secondary" onPress={() => router.push(`/record/mood?date=${selectedDate}`)} />
          </View>
        )}
      </Card>

      {/* 焦虑发作 */}
      <Card>
        <CardHeader
          icon="🌀"
          title={`焦虑发作${day.anxietyEvents.length > 0 ? `（${day.anxietyEvents.length} 次）` : ''}`}
          right={
            <TouchableOpacity onPress={() => router.push(`/record/anxiety?date=${selectedDate}`)}>
              <Text style={styles.link}>＋ 新增</Text>
            </TouchableOpacity>
          }
        />
        {day.anxietyEvents.length === 0 ? (
          <EmptyState icon="🍃" text="今天还没有焦虑发作记录" hint="点右上角「新增」记录一次发作" />
        ) : (
          day.anxietyEvents.map((e) => {
            const p = e.payload as Partial<AnxietyPayload>;
            return (
              <TouchableOpacity
                key={e.id}
                style={styles.eventRow}
                onPress={() => router.push(`/record/anxiety?date=${selectedDate}&id=${e.id}`)}
              >
                <View style={{ flex: 1 }}>
                  <Text style={typography.body}>
                    {p.time ?? '--:--'} · {formatMinutes(p.durationMinutes ?? 0)} · 强度{' '}
                    {typeof p.intensity === 'number' ? RATING_LABELS.anxietyIntensity[p.intensity - 1] : '-'}
                  </Text>
                  {(p.triggers?.length ?? 0) > 0 ? (
                    <Text style={typography.secondary}>诱因：{p.triggers!.join('、')}</Text>
                  ) : null}
                  {e.note ? <Text style={typography.secondary}>备注：{e.note}</Text> : null}
                </View>
                <TouchableOpacity
                  onPress={() => confirmDelete('这条焦虑发作记录', () => deleteAnxietyEvent(e.id))}
                  style={styles.eventDelete}
                >
                  <Text style={{ color: colors.danger, fontSize: 13 }}>删除</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            );
          })
        )}
      </Card>

      {/* 今日备注 */}
      <Card>
        <CardHeader icon="🗒️" title="今日备注" />
        <TextInput
          style={styles.noteInput}
          value={noteDraft}
          onChangeText={(t) => {
            setNoteDraft(t);
            setNoteDirty(true);
          }}
          placeholder="写点今天的整体情况…"
          placeholderTextColor={colors.textTertiary}
          multiline
        />
        {noteDirty ? (
          <Button
            label="保存备注"
            onPress={() => {
              saveDailyNote(noteDraft);
              setNoteDirty(false);
            }}
            style={{ marginTop: spacing.sm }}
          />
        ) : day.dailyNote ? (
          <Text style={styles.savedHint}>已保存</Text>
        ) : null}
      </Card>
      <View style={{ height: spacing.xl }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg },
  dateLabel: { ...typography.secondary, textAlign: 'center', marginBottom: spacing.md },
  headerActions: { flexDirection: 'row', gap: spacing.lg },
  link: { fontSize: 14, color: colors.primary },
  bigValue: { fontSize: 22, fontWeight: '700', color: colors.text, marginBottom: spacing.xs },
  noteText: { ...typography.secondary, marginTop: spacing.sm },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.sm },
  tagChip: {
    backgroundColor: colors.primarySoft,
    borderRadius: 999,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
  },
  tagChipText: { fontSize: 12, color: colors.primary },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  eventDelete: { padding: spacing.sm },
  noteInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    padding: spacing.md,
    minHeight: 80,
    textAlignVertical: 'top',
    fontSize: 14,
    color: colors.text,
  },
  savedHint: { ...typography.secondary, color: colors.success, marginTop: spacing.sm, textAlign: 'right' },
});
