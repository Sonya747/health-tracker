import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { AnxietyPayload, BowelPayload, MoodPayload, SleepPayload } from '@health-tracker/core';
import { formatMinutes } from '@health-tracker/core';
import { BUILT_IN_CATEGORY_IDS, RATING_LABELS } from '@health-tracker/ui-schema';
import * as repo from '../db/repo';
import { colors, spacing, typography } from '../theme';
import { Card, CardHeader, EmptyState } from './ui';

/** 某一天的完整明细（统计-日视图 与 当日详情页共用） */
export function DayDetail({ date }: { date: string }) {
  const records = repo.getRecordsByDate(date);
  const dailyNote = repo.getDailyNote(date);
  const byCat = (id: string) => records.filter((r) => r.categoryId === id);

  const bowelEvents = byCat(BUILT_IN_CATEGORY_IDS.bowel);
  const urination = byCat(BUILT_IN_CATEGORY_IDS.urination)[0];
  const sleep = byCat(BUILT_IN_CATEGORY_IDS.sleep)[0];
  const mood = byCat(BUILT_IN_CATEGORY_IDS.mood)[0];
  const anxietyEvents = byCat(BUILT_IN_CATEGORY_IDS.anxiety);

  if (records.length === 0 && !dailyNote) {
    return (
      <Card>
        <EmptyState icon="🗓️" text="这一天没有任何记录" hint="回到今日页可以补录" />
      </Card>
    );
  }

  const sleepP = sleep?.payload as Partial<SleepPayload> | undefined;
  const moodP = mood?.payload as Partial<MoodPayload> | undefined;

  return (
    <View>
      <Card>
        <CardHeader icon="🔢" title="计数" />
        <View style={styles.counterRow}>
          <View style={styles.counterItem}>
            <Text style={styles.counterValue}>{bowelEvents.length}</Text>
            <Text style={typography.secondary}>排便（次）</Text>
          </View>
          <View style={styles.counterItem}>
            <Text style={styles.counterValue}>
              {typeof urination?.value === 'number' ? urination.value : 0}
            </Text>
            <Text style={typography.secondary}>排尿（次）</Text>
          </View>
        </View>
        {urination?.note ? <Text style={styles.noteText}>排尿备注：{urination.note}</Text> : null}
      </Card>

      {bowelEvents.length > 0 ? (
        <Card>
          <CardHeader icon="💩" title={`排便明细（${bowelEvents.length} 次）`} />
          {bowelEvents.map((e) => {
            const p = e.payload as Partial<BowelPayload>;
            return (
              <View key={e.id} style={styles.eventRow}>
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
            );
          })}
        </Card>
      ) : null}

      <Card>
        <CardHeader icon="😴" title="睡眠" />
        {sleep && sleepP ? (
          <View>
            <Text style={typography.body}>
              {formatMinutes(sleepP.durationMinutes ?? 0)}
              {sleepP.startTime && sleepP.endTime ? `（${sleepP.startTime} - ${sleepP.endTime}）` : ''}
            </Text>
            {typeof sleepP.quality === 'number' ? (
              <Text style={typography.secondary}>质量：{RATING_LABELS.sleepQuality[sleepP.quality - 1]}</Text>
            ) : null}
            {typeof sleepP.awakeCount === 'number' ||
            typeof sleepP.awakeMinutes === 'number' ||
            typeof sleepP.deepSleepPercent === 'number' ? (
              <Text style={typography.secondary}>
                {[
                  typeof sleepP.awakeCount === 'number' ? `清醒 ${sleepP.awakeCount} 次` : null,
                  typeof sleepP.awakeMinutes === 'number' ? `清醒共 ${formatMinutes(sleepP.awakeMinutes)}` : null,
                  typeof sleepP.deepSleepPercent === 'number' ? `深睡 ${sleepP.deepSleepPercent}%` : null,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </Text>
            ) : null}
            {(sleepP.sleepTags?.length ?? 0) > 0 ? (
              <Text style={typography.secondary}>标签：{sleepP.sleepTags!.join('、')}</Text>
            ) : null}
            {sleep.note ? <Text style={styles.noteText}>备注：{sleep.note}</Text> : null}
          </View>
        ) : (
          <Text style={styles.emptyLine}>未记录</Text>
        )}
      </Card>

      <Card>
        <CardHeader icon="🙂" title="个人状态" />
        {mood && moodP ? (
          <View>
            {typeof moodP.rating === 'number' ? (
              <Text style={typography.body}>
                评分：{moodP.rating} 分（{RATING_LABELS.moodRating[moodP.rating - 1]}）
              </Text>
            ) : null}
            {(moodP.statusTags?.length ?? 0) > 0 ? (
              <Text style={typography.secondary}>标签：{moodP.statusTags!.join('、')}</Text>
            ) : null}
            {mood.note ? <Text style={styles.noteText}>备注：{mood.note}</Text> : null}
          </View>
        ) : (
          <Text style={styles.emptyLine}>未记录</Text>
        )}
      </Card>

      <Card>
        <CardHeader icon="🌀" title={`焦虑发作（${anxietyEvents.length} 次）`} />
        {anxietyEvents.length === 0 ? (
          <Text style={styles.emptyLine}>无发作记录</Text>
        ) : (
          anxietyEvents.map((e) => {
            const p = e.payload as Partial<AnxietyPayload>;
            return (
              <View key={e.id} style={styles.eventRow}>
                <Text style={typography.body}>
                  {p.time ?? '--:--'} · {formatMinutes(p.durationMinutes ?? 0)} · 强度{' '}
                  {typeof p.intensity === 'number' ? RATING_LABELS.anxietyIntensity[p.intensity - 1] : '-'}
                </Text>
                {(p.triggers?.length ?? 0) > 0 ? (
                  <Text style={typography.secondary}>诱因：{p.triggers!.join('、')}</Text>
                ) : null}
                {e.note ? <Text style={typography.secondary}>备注：{e.note}</Text> : null}
              </View>
            );
          })
        )}
      </Card>

      {dailyNote ? (
        <Card>
          <CardHeader icon="🗒️" title="今日备注" />
          <Text style={typography.body}>{dailyNote.note}</Text>
        </Card>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  counterRow: { flexDirection: 'row' },
  counterItem: { flex: 1, alignItems: 'center' },
  counterValue: { fontSize: 28, fontWeight: '700', color: colors.text },
  noteText: { ...typography.secondary, marginTop: spacing.sm },
  emptyLine: { ...typography.secondary, color: colors.textTertiary },
  eventRow: {
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
});
