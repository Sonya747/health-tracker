import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, radius, spacing } from '../theme';

export type BarDatum = {
  key: string;
  label: string;
  value: number | null;
  /** 展示在柱子上方的文案，缺省用 value */
  display?: string;
};

/** 纯 View 实现的轻量柱状图，value 为 null 表示无记录 */
export function BarChart({
  data,
  color = colors.primary,
  onPressBar,
  maxHeight = 96,
}: {
  data: BarDatum[];
  color?: string;
  onPressBar?: (key: string) => void;
  maxHeight?: number;
}) {
  const max = Math.max(1, ...data.map((d) => d.value ?? 0));
  return (
    <View style={styles.row}>
      {data.map((d) => {
        const h = d.value === null || d.value === 0 ? 0 : Math.max(4, (d.value / max) * maxHeight);
        return (
          <TouchableOpacity
            key={d.key}
            style={styles.item}
            onPress={onPressBar ? () => onPressBar(d.key) : undefined}
            disabled={!onPressBar}
          >
            <Text style={styles.value} numberOfLines={1}>
              {d.value === null ? '–' : (d.display ?? String(d.value))}
            </Text>
            <View style={[styles.barArea, { height: maxHeight }]}>
              {h > 0 ? <View style={[styles.bar, { height: h, backgroundColor: color }]} /> : (
                <View style={styles.emptyDot} />
              )}
            </View>
            <Text style={styles.label} numberOfLines={1}>
              {d.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: 4 },
  item: { flex: 1, alignItems: 'center' },
  value: { fontSize: 10, color: colors.textSecondary, marginBottom: 2 },
  barArea: { justifyContent: 'flex-end', alignItems: 'center', alignSelf: 'stretch' },
  bar: { width: '55%', borderRadius: radius.sm / 2, minHeight: 4 },
  emptyDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginBottom: 0,
  },
  label: { fontSize: 10, color: colors.textTertiary, marginTop: spacing.xs },
});
