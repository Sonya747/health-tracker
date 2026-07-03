import React from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { formatDateKey, isValidDateKey } from '@health-tracker/core';
import { DayDetail } from '../../components/DayDetail';
import { Card, EmptyState } from '../../components/ui';
import { colors, spacing, typography } from '../../theme';

export default function DayDetailScreen() {
  const { date } = useLocalSearchParams<{ date: string }>();
  const valid = typeof date === 'string' && isValidDateKey(date);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: valid ? formatDateKey(date) : '当日详情' }} />
      {valid ? (
        <>
          <Text style={[typography.secondary, { textAlign: 'center', marginBottom: spacing.md }]}>{date}</Text>
          <DayDetail date={date} />
        </>
      ) : (
        <Card>
          <EmptyState icon="⚠️" text="无效的日期" />
        </Card>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg },
});
