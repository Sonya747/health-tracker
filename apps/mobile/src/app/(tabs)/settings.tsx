import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import Constants from 'expo-constants';
import { Card, CardHeader } from '../../components/ui';
import { exportCsv, exportJson } from '../../features/exportData';
import { colors, spacing, typography } from '../../theme';

function Row({
  title,
  subtitle,
  right,
  onPress,
  disabled,
}: {
  title: string;
  subtitle?: string;
  right?: string;
  onPress?: () => void;
  disabled?: boolean;
}) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} disabled={disabled || !onPress}>
      <View style={{ flex: 1 }}>
        <Text style={[typography.body, disabled && { color: colors.textTertiary }]}>{title}</Text>
        {subtitle ? <Text style={styles.rowSubtitle}>{subtitle}</Text> : null}
      </View>
      <Text style={styles.rowRight}>{right ?? (onPress && !disabled ? '›' : '')}</Text>
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const [exporting, setExporting] = useState(false);

  const doExport = async (kind: 'json' | 'csv') => {
    if (exporting) return;
    setExporting(true);
    try {
      if (kind === 'json') await exportJson();
      else await exportCsv();
    } catch (e) {
      Alert.alert('导出失败', e instanceof Error ? e.message : '未知错误，请重试');
    } finally {
      setExporting(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Card>
        <CardHeader icon="📤" title="数据导出" />
        <Row
          title="导出 JSON"
          subtitle="全部类别、记录和每日备注，可用于备份"
          onPress={() => doExport('json')}
          disabled={exporting}
        />
        <Row
          title="导出 CSV"
          subtitle="记录表格，可在 Excel / Numbers 打开"
          onPress={() => doExport('csv')}
          disabled={exporting}
        />
      </Card>

      <Card>
        <CardHeader icon="🔒" title="隐私与数据" />
        <Row title="隐私说明" subtitle="数据用途与存储方式" onPress={() => router.push('/privacy')} />
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            当前版本的所有数据仅保存在这台设备上，不上传云端、不需要账号。卸载 App
            或清除应用数据会删除全部记录，建议定期导出 JSON 备份。
          </Text>
        </View>
      </Card>

      <Card>
        <CardHeader icon="🧩" title="记录类别" />
        <Row title="类别管理" subtitle="自定义记录类别与表单项" right="即将支持" disabled />
      </Card>

      <Card>
        <CardHeader icon="ℹ️" title="关于" />
        <Row title="版本" right={Constants.expoConfig?.version ?? '0.1.0'} />
        <Row title="离线使用" right="不联网、无广告" />
      </Card>
      <View style={{ height: spacing.xl }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  rowSubtitle: { ...typography.secondary, marginTop: 2 },
  rowRight: { fontSize: 14, color: colors.textTertiary, marginLeft: spacing.md },
  infoBox: {
    backgroundColor: colors.primarySoft,
    borderRadius: 8,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  infoText: { fontSize: 13, color: colors.textSecondary, lineHeight: 20 },
});
