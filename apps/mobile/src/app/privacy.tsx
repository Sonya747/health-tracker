import React from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { Card } from '../components/ui';
import { colors, spacing, typography } from '../theme';

const sections: { title: string; body: string }[] = [
  {
    title: '数据保存在哪里',
    body: '你的所有记录（排便、排尿、睡眠、个人状态、焦虑发作和备注）只保存在这台设备的本地数据库中。当前版本没有云端同步，也没有账号系统。',
  },
  {
    title: '数据会被上传吗',
    body: '不会。App 默认不联网，不接入广告 SDK，也不接入第三方统计分析。除非你主动使用导出功能，数据不会以任何形式离开这台设备。',
  },
  {
    title: '导出功能',
    body: '导出 JSON / CSV 由你手动触发，文件通过系统分享面板发送到你选择的位置（例如保存到本机文件、发送到你自己的网盘等）。导出后文件的安全由接收方应用负责，请谨慎选择分享对象。',
  },
  {
    title: '数据备份提醒',
    body: '因为数据仅存在本机，卸载 App、清除应用数据或更换手机都会导致记录丢失。建议定期在「设置 → 数据导出」中导出 JSON 备份。',
  },
  {
    title: '这些数据的用途',
    body: '记录仅用于你自己的健康观察和回顾。App 不做医疗诊断，统计页只展示事实和趋势；如有健康疑问，请咨询专业医生。',
  },
];

export default function PrivacyScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {sections.map((s) => (
        <Card key={s.title}>
          <Text style={styles.title}>{s.title}</Text>
          <Text style={styles.body}>{s.body}</Text>
        </Card>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg },
  title: { ...typography.cardTitle, marginBottom: spacing.sm },
  body: { fontSize: 14, color: colors.textSecondary, lineHeight: 22 },
});
