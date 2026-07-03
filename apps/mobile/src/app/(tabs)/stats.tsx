import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  addDays,
  computeCounterStats,
  computeDurationStats,
  computeEventStats,
  computeRatingStats,
  formatMinutes,
  monthRangeOf,
  parseDateKey,
  toDateKey,
  todayKey,
  weekRangeOf,
  type DateRange,
} from '@health-tracker/core';
import { BUILT_IN_CATEGORY_IDS } from '@health-tracker/ui-schema';
import { BarChart } from '../../components/BarChart';
import { DayDetail } from '../../components/DayDetail';
import { CalendarModal } from '../../components/pickers';
import { Card, CardHeader, EmptyState } from '../../components/ui';
import * as repo from '../../db/repo';
import { useHealthStore } from '../../stores/useHealthStore';
import { colors, radius, spacing, typography } from '../../theme';

type Mode = 'day' | 'week' | 'month';

const weekdayShort = ['一', '二', '三', '四', '五', '六', '日'];

export default function StatsScreen() {
  const router = useRouter();
  const dataVersion = useHealthStore((s) => s.dataVersion);
  const [mode, setMode] = useState<Mode>('day');
  const [anchor, setAnchor] = useState(todayKey());
  const [calendarVisible, setCalendarVisible] = useState(false);

  const range: DateRange = useMemo(() => {
    if (mode === 'day') return { start: anchor, end: anchor };
    if (mode === 'week') return weekRangeOf(anchor);
    return monthRangeOf(anchor);
  }, [mode, anchor]);

  const shift = (dir: 1 | -1) => {
    if (mode === 'day') setAnchor(addDays(anchor, dir));
    else if (mode === 'week') setAnchor(addDays(anchor, dir * 7));
    else {
      const d = parseDateKey(anchor);
      setAnchor(toDateKey(new Date(d.getFullYear(), d.getMonth() + dir, 1)));
    }
  };

  const rangeLabel = useMemo(() => {
    if (mode === 'day') return anchor;
    if (mode === 'week') return `${range.start} ~ ${range.end}`;
    const d = parseDateKey(anchor);
    return `${d.getFullYear()}年${d.getMonth() + 1}月`;
  }, [mode, anchor, range]);

  // dataVersion 变化时重新查询，保证记录后统计即时更新
  const stats = useMemo(() => {
    if (mode === 'day') return null;
    const load = (catId: string) => repo.getRecordsByRange(range.start, range.end, catId);
    return {
      bowel: computeCounterStats(load(BUILT_IN_CATEGORY_IDS.bowel), range),
      urination: computeCounterStats(load(BUILT_IN_CATEGORY_IDS.urination), range),
      sleep: computeDurationStats(load(BUILT_IN_CATEGORY_IDS.sleep), range),
      anxiety: computeEventStats(load(BUILT_IN_CATEGORY_IDS.anxiety), range),
      mood: computeRatingStats(load(BUILT_IN_CATEGORY_IDS.mood), range),
      recordDates: new Set(
        repo.getRecordsByRange(range.start, range.end).map((r) => r.recordDate),
      ),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, range.start, range.end, dataVersion]);

  const barLabel = (date: string, idx: number) =>
    mode === 'week' ? `周${weekdayShort[idx]}` : String(parseDateKey(date).getDate());

  const hasAnyData =
    stats &&
    (stats.bowel.recordedDays > 0 ||
      stats.urination.recordedDays > 0 ||
      stats.sleep.recordedDays > 0 ||
      stats.anxiety.totalCount > 0 ||
      stats.mood.recordedDays > 0 ||
      stats.recordDates.size > 0);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* 日/周/月切换 */}
      <View style={styles.segment}>
        {(
          [
            ['day', '日'],
            ['week', '周'],
            ['month', '月'],
          ] as [Mode, string][]
        ).map(([m, label]) => (
          <TouchableOpacity
            key={m}
            style={[styles.segmentItem, mode === m && styles.segmentItemActive]}
            onPress={() => setMode(m)}
          >
            <Text style={[styles.segmentText, mode === m && styles.segmentTextActive]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* 区间切换 */}
      <View style={styles.rangeRow}>
        <TouchableOpacity style={styles.rangeArrow} onPress={() => shift(-1)}>
          <Text style={styles.rangeArrowText}>‹</Text>
        </TouchableOpacity>
        <TouchableOpacity style={{ flex: 1, alignItems: 'center' }} onPress={() => setCalendarVisible(true)}>
          <Text style={styles.rangeLabel}>{rangeLabel}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.rangeArrow} onPress={() => shift(1)}>
          <Text style={styles.rangeArrowText}>›</Text>
        </TouchableOpacity>
      </View>

      {mode === 'day' ? (
        // key 确保 dataVersion / anchor 变化时重新读取
        <DayDetail key={`${anchor}-${dataVersion}`} date={anchor} />
      ) : !hasAnyData ? (
        <Card>
          <EmptyState icon="📭" text="这个时间段还没有记录" hint="去今日页记录后再来看统计" />
        </Card>
      ) : (
        stats && (
          <View>
            <Card>
              <CardHeader icon="💩" title="排便" />
              <Text style={styles.summaryLine}>
                共 {stats.bowel.total} 次 · 日均 {stats.bowel.dailyAvg.toFixed(1)} 次 · 记录{' '}
                {stats.bowel.recordedDays} 天
              </Text>
              <BarChart
                color="#B08968"
                data={stats.bowel.perDay.map((d, i) => ({
                  key: d.date,
                  label: barLabel(d.date, i),
                  value: d.count,
                }))}
                onPressBar={(date) => router.push(`/day/${date}`)}
              />
            </Card>

            <Card>
              <CardHeader icon="💧" title="排尿" />
              <Text style={styles.summaryLine}>
                共 {stats.urination.total} 次 · 日均 {stats.urination.dailyAvg.toFixed(1)} 次 · 记录{' '}
                {stats.urination.recordedDays} 天
              </Text>
              <BarChart
                color="#4A90D9"
                data={stats.urination.perDay.map((d, i) => ({
                  key: d.date,
                  label: barLabel(d.date, i),
                  value: d.count,
                }))}
                onPressBar={(date) => router.push(`/day/${date}`)}
              />
            </Card>

            <Card>
              <CardHeader icon="😴" title="睡眠" />
              {stats.sleep.recordedDays > 0 ? (
                <View>
                  <Text style={styles.summaryLine}>
                    平均 {formatMinutes(Math.round(stats.sleep.avgMinutes))} · 最长{' '}
                    {formatMinutes(stats.sleep.maxMinutes)} · 最短 {formatMinutes(stats.sleep.minMinutes)}
                    {stats.sleep.avgQuality !== null
                      ? ` · 平均质量 ${stats.sleep.avgQuality.toFixed(1)}`
                      : ''}
                  </Text>
                  {stats.sleep.avgAwakeCount !== null ||
                  stats.sleep.avgAwakeMinutes !== null ||
                  stats.sleep.avgDeepSleepPercent !== null ? (
                    <Text style={styles.summaryLine}>
                      {[
                        stats.sleep.avgAwakeCount !== null
                          ? `平均清醒 ${stats.sleep.avgAwakeCount.toFixed(1)} 次`
                          : null,
                        stats.sleep.avgAwakeMinutes !== null
                          ? `平均清醒 ${formatMinutes(Math.round(stats.sleep.avgAwakeMinutes))}`
                          : null,
                        stats.sleep.avgDeepSleepPercent !== null
                          ? `平均深睡 ${stats.sleep.avgDeepSleepPercent.toFixed(0)}%`
                          : null,
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </Text>
                  ) : null}
                  <BarChart
                    color="#7C6FDE"
                    data={stats.sleep.perDay.map((d, i) => ({
                      key: d.date,
                      label: barLabel(d.date, i),
                      value: d.minutes === null ? null : Math.round((d.minutes / 60) * 10) / 10,
                      display: d.minutes === null ? undefined : `${(d.minutes / 60).toFixed(1)}h`,
                    }))}
                    onPressBar={(date) => router.push(`/day/${date}`)}
                  />
                  {stats.sleep.topSleepTags.length > 0 ? (
                    <Text style={[typography.secondary, { marginTop: spacing.sm }]}>
                      常见标签：
                      {stats.sleep.topSleepTags
                        .slice(0, 3)
                        .map((t) => `${t.tag}（${t.count} 次）`)
                        .join('、')}
                    </Text>
                  ) : null}
                </View>
              ) : (
                <Text style={styles.emptyLine}>暂无睡眠记录</Text>
              )}
            </Card>

            <Card>
              <CardHeader icon="🌀" title="焦虑发作" />
              {stats.anxiety.totalCount > 0 ? (
                <View>
                  <Text style={styles.summaryLine}>
                    共 {stats.anxiety.totalCount} 次 · 总时长 {formatMinutes(stats.anxiety.totalDurationMinutes)}
                    {stats.anxiety.avgIntensity !== null
                      ? ` · 平均强度 ${stats.anxiety.avgIntensity.toFixed(1)}`
                      : ''}
                  </Text>
                  <BarChart
                    color="#E07A5F"
                    data={stats.anxiety.perDay.map((d, i) => ({
                      key: d.date,
                      label: barLabel(d.date, i),
                      value: d.count,
                    }))}
                    onPressBar={(date) => router.push(`/day/${date}`)}
                  />
                  {stats.anxiety.topTriggers.length > 0 ? (
                    <Text style={[typography.secondary, { marginTop: spacing.sm }]}>
                      常见诱因：
                      {stats.anxiety.topTriggers
                        .slice(0, 3)
                        .map((t) => `${t.tag}（${t.count} 次）`)
                        .join('、')}
                    </Text>
                  ) : null}
                </View>
              ) : (
                <Text style={styles.emptyLine}>暂无焦虑发作记录</Text>
              )}
            </Card>

            <Card>
              <CardHeader icon="🙂" title="个人状态" />
              {stats.mood.recordedDays > 0 && stats.mood.avgRating !== null ? (
                <Text style={styles.summaryLine}>
                  平均评分 {stats.mood.avgRating.toFixed(1)} 分 · 记录 {stats.mood.recordedDays} 天
                </Text>
              ) : stats.mood.recordedDays > 0 ? (
                <Text style={styles.summaryLine}>记录 {stats.mood.recordedDays} 天（未打分）</Text>
              ) : (
                <Text style={styles.emptyLine}>暂无状态记录</Text>
              )}
            </Card>

            {mode === 'month' ? (
              <Card>
                <CardHeader icon="🗓️" title={`记录覆盖（${stats.recordDates.size} 天有记录）`} />
                <View style={styles.coverageWrap}>
                  {stats.bowel.perDay.map((d) => {
                    const has = stats.recordDates.has(d.date);
                    return (
                      <TouchableOpacity
                        key={d.date}
                        style={[styles.coverageDay, has && styles.coverageDayActive]}
                        onPress={() => router.push(`/day/${d.date}`)}
                      >
                        <Text style={[styles.coverageText, has && { color: '#fff' }]}>
                          {parseDateKey(d.date).getDate()}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                <Text style={[typography.secondary, { marginTop: spacing.sm }]}>点击日期查看当天详情</Text>
              </Card>
            ) : null}
          </View>
        )
      )}

      <CalendarModal
        visible={calendarVisible}
        initial={anchor}
        onClose={() => setCalendarVisible(false)}
        onConfirm={(d) => {
          setCalendarVisible(false);
          setAnchor(d);
        }}
      />
      <View style={{ height: spacing.xl }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg },
  segment: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: 4,
    marginBottom: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  segmentItem: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: radius.sm },
  segmentItemActive: { backgroundColor: colors.primary },
  segmentText: { fontSize: 14, color: colors.textSecondary, fontWeight: '600' },
  segmentTextActive: { color: '#fff' },
  rangeRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  rangeArrow: { paddingHorizontal: spacing.lg, paddingVertical: spacing.xs },
  rangeArrowText: { fontSize: 24, color: colors.primary, fontWeight: '600' },
  rangeLabel: { fontSize: 15, fontWeight: '600', color: colors.text },
  summaryLine: { ...typography.secondary, marginBottom: spacing.md },
  emptyLine: { ...typography.secondary, color: colors.textTertiary },
  coverageWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  coverageDay: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverageDayActive: { backgroundColor: colors.primary },
  coverageText: { fontSize: 12, color: colors.textTertiary },
});
