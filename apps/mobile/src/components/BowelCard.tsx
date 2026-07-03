import React, { useEffect, useRef, useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, Vibration, View } from 'react-native';
import { useRouter } from 'expo-router';
import type { BowelPayload } from '@health-tracker/core';
import { formatMinutes, todayKey, validateCount } from '@health-tracker/core';
import { useHealthStore } from '../stores/useHealthStore';
import { colors, radius, spacing, typography } from '../theme';
import { Button, Card, CardHeader, EmptyState, ErrorList, FieldLabel, ModalSheet } from './ui';

function formatElapsed(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

/**
 * 排便卡片：每次排便一条事件记录。
 * 计时模式（默认）：点「开始计时」→「结束」，系统记录时长，超过阈值本地通知 + 震动提醒；
 * 快速模式：点「＋」新增后编辑详细信息。两种模式都支持补录、次数手动编辑、删除。
 */
export function BowelCard() {
  const router = useRouter();
  const {
    selectedDate,
    day,
    bowelRecordMode,
    bowelReminderMinutes,
    bowelTimerStart,
    startBowelTimer,
    finishBowelTimer,
    cancelBowelTimer,
    deleteBowelEvent,
    setBowelCount,
  } = useHealthStore();

  const events = day?.bowelEvents ?? [];
  const count = events.length;
  const isToday = selectedDate === todayKey();

  // 计时中的已用时间（秒级刷新）
  const [elapsedMs, setElapsedMs] = useState(0);
  const overThresholdNotified = useRef(false);
  useEffect(() => {
    if (!bowelTimerStart) {
      setElapsedMs(0);
      overThresholdNotified.current = false;
      return;
    }
    const startMs = new Date(bowelTimerStart).getTime();
    const tick = () => {
      const ms = Date.now() - startMs;
      setElapsedMs(ms);
      // 前台兜底提醒：跨过阈值时震动一次（通知权限被拒时也有反馈）
      if (!overThresholdNotified.current && ms >= bowelReminderMinutes * 60_000) {
        overThresholdNotified.current = true;
        Vibration.vibrate([0, 300, 200, 300]);
      }
    };
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [bowelTimerStart, bowelReminderMinutes]);

  const overThreshold = bowelTimerStart !== null && elapsedMs >= bowelReminderMinutes * 60_000;

  // 次数手动编辑
  const [editVisible, setEditVisible] = useState(false);
  const [draftCount, setDraftCount] = useState(String(count));
  const [errors, setErrors] = useState<string[]>([]);

  const openCountEdit = () => {
    setDraftCount(String(count));
    setErrors([]);
    setEditVisible(true);
  };

  const saveCount = () => {
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
    const apply = () => {
      setBowelCount(n);
      setEditVisible(false);
    };
    if (n < count) {
      Alert.alert('删除确认', `将删除最近的 ${count - n} 条排便记录，确定吗？`, [
        { text: '取消', style: 'cancel' },
        { text: '删除', style: 'destructive', onPress: apply },
      ]);
    } else {
      apply();
    }
  };

  const confirmDeleteEvent = (id: string) => {
    Alert.alert('删除确认', '确定要删除这条排便记录吗？删除后无法恢复。', [
      { text: '取消', style: 'cancel' },
      { text: '删除', style: 'destructive', onPress: () => deleteBowelEvent(id) },
    ]);
  };

  const removeLatest = () => {
    if (count === 0) return;
    Alert.alert('删除确认', '减一将删除最近一条排便记录，确定吗？', [
      { text: '取消', style: 'cancel' },
      { text: '删除', style: 'destructive', onPress: () => setBowelCount(count - 1) },
    ]);
  };

  const stopTimer = async () => {
    const id = await finishBowelTimer();
    if (id) {
      // 打开编辑页补充大便状态等详情（记录已保存，放弃编辑也不丢）
      router.push(`/record/bowel?date=${selectedDate}&id=${id}`);
    }
  };

  const confirmCancelTimer = () => {
    Alert.alert('放弃计时', '本次计时将不会保存为记录，确定放弃吗？', [
      { text: '继续计时', style: 'cancel' },
      { text: '放弃', style: 'destructive', onPress: () => void cancelBowelTimer() },
    ]);
  };

  return (
    <Card>
      <CardHeader
        icon="💩"
        title={`排便（${count} 次）`}
        right={
          <TouchableOpacity onPress={() => router.push(`/record/bowel?date=${selectedDate}`)}>
            <Text style={styles.link}>＋ 补录</Text>
          </TouchableOpacity>
        }
      />

      {bowelRecordMode === 'timer' ? (
        bowelTimerStart ? (
          <View>
            <TouchableOpacity
              style={[styles.timerBtn, overThreshold && styles.timerBtnOver]}
              onPress={() => void stopTimer()}
            >
              <Text style={styles.timerBtnText}>结束（已 {formatElapsed(elapsedMs)}）</Text>
            </TouchableOpacity>
            {overThreshold ? (
              <Text style={styles.overWarning}>已超过 {bowelReminderMinutes} 分钟，建议结束休息一下</Text>
            ) : null}
            <TouchableOpacity onPress={confirmCancelTimer} style={styles.cancelTimer}>
              <Text style={styles.cancelTimerText}>放弃本次计时</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View>
            <TouchableOpacity
              style={[styles.timerBtn, !isToday && styles.timerBtnDisabled]}
              onPress={() => void startBowelTimer()}
              disabled={!isToday}
            >
              <Text style={styles.timerBtnText}>▶ 开始计时</Text>
            </TouchableOpacity>
            <Text style={styles.timerHint}>
              {isToday
                ? `结束时自动记录时长，超过 ${bowelReminderMinutes} 分钟会提醒（设置中可调）`
                : '计时只能记录今天，历史日期请用「＋ 补录」'}
            </Text>
          </View>
        )
      ) : (
        <View style={styles.counterRow}>
          <TouchableOpacity
            style={[styles.adjustBtn, count <= 0 && styles.adjustBtnDisabled]}
            onPress={removeLatest}
            disabled={count <= 0}
            accessibilityLabel="排便减一"
          >
            <Text style={[styles.adjustBtnText, count <= 0 && { color: colors.textTertiary }]}>−</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.countBox} onPress={openCountEdit}>
            <Text style={styles.count}>{count}</Text>
            <Text style={styles.unit}>次</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.adjustBtn}
            onPress={() => router.push(`/record/bowel?date=${selectedDate}`)}
            accessibilityLabel="排便加一"
          >
            <Text style={styles.adjustBtnText}>＋</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 当日事件列表 */}
      {events.length === 0 ? (
        bowelRecordMode === 'timer' ? (
          <EmptyState icon="🚽" text="今天还没有排便记录" hint="点上方「开始计时」或右上角「补录」" />
        ) : null
      ) : (
        <View style={styles.eventList}>
          {events.map((e) => {
            const p = e.payload as Partial<BowelPayload>;
            return (
              <TouchableOpacity
                key={e.id}
                style={styles.eventRow}
                onPress={() => router.push(`/record/bowel?date=${selectedDate}&id=${e.id}`)}
              >
                <View style={{ flex: 1 }}>
                  <Text style={typography.body}>
                    {p.time ?? '时间未记录'}
                    {typeof p.durationMinutes === 'number' ? ` · ${formatMinutes(p.durationMinutes)}` : ''}
                    {p.byTimer ? ' · 计时' : ''}
                  </Text>
                  {(p.stoolTags?.length ?? 0) > 0 ? (
                    <Text style={typography.secondary}>状态：{p.stoolTags!.join('、')}</Text>
                  ) : null}
                  {e.note ? <Text style={typography.secondary}>备注：{e.note}</Text> : null}
                </View>
                <TouchableOpacity onPress={() => confirmDeleteEvent(e.id)} style={styles.eventDelete}>
                  <Text style={{ color: colors.danger, fontSize: 13 }}>删除</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            );
          })}
          {bowelRecordMode === 'timer' ? (
            <TouchableOpacity onPress={openCountEdit} style={styles.countEditLink}>
              <Text style={styles.link}>编辑次数</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      )}

      <ModalSheet visible={editVisible} onClose={() => setEditVisible(false)} title="编辑排便次数">
        <FieldLabel label="次数" required />
        <TextInput
          style={styles.input}
          value={draftCount}
          onChangeText={setDraftCount}
          keyboardType="number-pad"
          maxLength={2}
        />
        <Text style={styles.modalHint}>
          增加会补空白记录（可在列表中补充详情），减少会删除最近的记录。
        </Text>
        <ErrorList errors={errors} />
        <View style={styles.modalActions}>
          <Button label="清零" variant="danger" onPress={() => setDraftCount('0')} style={{ flex: 1 }} />
          <Button label="保存" onPress={saveCount} style={{ flex: 2 }} />
        </View>
      </ModalSheet>
    </Card>
  );
}

const styles = StyleSheet.create({
  link: { fontSize: 14, color: colors.primary },
  timerBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  timerBtnOver: { backgroundColor: colors.danger },
  timerBtnDisabled: { backgroundColor: colors.border },
  timerBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  timerHint: { ...typography.secondary, color: colors.textTertiary, marginTop: spacing.sm, textAlign: 'center' },
  overWarning: { color: colors.danger, fontSize: 13, marginTop: spacing.sm, textAlign: 'center' },
  cancelTimer: { alignItems: 'center', marginTop: spacing.sm, padding: spacing.xs },
  cancelTimerText: { fontSize: 13, color: colors.textSecondary },
  counterRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
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
  eventList: { marginTop: spacing.md },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  eventDelete: { padding: spacing.sm },
  countEditLink: { paddingTop: spacing.sm, alignItems: 'flex-end' },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    fontSize: 16,
    color: colors.text,
  },
  modalHint: { ...typography.secondary, color: colors.textTertiary, marginTop: spacing.sm },
  modalActions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xl },
});
