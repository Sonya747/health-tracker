import React from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { colors, radius, spacing, typography } from '../theme';

export function Card({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function CardHeader({
  icon,
  title,
  right,
}: {
  icon?: string;
  title: string;
  right?: React.ReactNode;
}) {
  return (
    <View style={styles.cardHeader}>
      <View style={styles.cardHeaderLeft}>
        {icon ? <Text style={styles.cardIcon}>{icon}</Text> : null}
        <Text style={typography.cardTitle}>{title}</Text>
      </View>
      {right}
    </View>
  );
}

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled,
  style,
}: {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const bg =
    variant === 'primary'
      ? colors.primary
      : variant === 'danger'
        ? colors.dangerSoft
        : variant === 'secondary'
          ? colors.primarySoft
          : 'transparent';
  const fg =
    variant === 'primary' ? '#fff' : variant === 'danger' ? colors.danger : colors.primary;
  return (
    <TouchableOpacity
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled}
      style={[styles.button, { backgroundColor: bg, opacity: disabled ? 0.5 : 1 }, style]}
    >
      <Text style={[styles.buttonLabel, { color: fg }]}>{label}</Text>
    </TouchableOpacity>
  );
}

export function EmptyState({ icon = '🗒️', text, hint }: { icon?: string; text: string; hint?: string }) {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyIcon}>{icon}</Text>
      <Text style={styles.emptyText}>{text}</Text>
      {hint ? <Text style={styles.emptyHint}>{hint}</Text> : null}
    </View>
  );
}

/** 底部弹层，点击遮罩关闭 */
export function ModalSheet({
  visible,
  onClose,
  title,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          {title ? <Text style={styles.sheetTitle}>{title}</Text> : null}
          {children}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export function FieldLabel({ label, required }: { label: string; required?: boolean }) {
  return (
    <Text style={styles.fieldLabel}>
      {label}
      {required ? <Text style={{ color: colors.danger }}> *</Text> : null}
    </Text>
  );
}

export function ErrorList({ errors }: { errors: string[] }) {
  if (errors.length === 0) return null;
  return (
    <View style={styles.errorBox}>
      {errors.map((e) => (
        <Text key={e} style={styles.errorText}>
          · {e}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  cardHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  cardIcon: { fontSize: 18 },
  button: {
    borderRadius: radius.md,
    paddingVertical: 12,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonLabel: { fontSize: 15, fontWeight: '600' },
  empty: { alignItems: 'center', paddingVertical: spacing.xl },
  emptyIcon: { fontSize: 32, marginBottom: spacing.sm },
  emptyText: { ...typography.body, color: colors.textSecondary },
  emptyHint: { ...typography.secondary, color: colors.textTertiary, marginTop: spacing.xs },
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.xl,
    paddingBottom: spacing.xl + 12,
    maxHeight: '85%',
  },
  sheetTitle: { ...typography.title, fontSize: 17, marginBottom: spacing.lg, textAlign: 'center' },
  fieldLabel: { ...typography.secondary, marginBottom: spacing.xs, marginTop: spacing.md },
  errorBox: {
    backgroundColor: colors.dangerSoft,
    borderRadius: radius.sm,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  errorText: { color: colors.danger, fontSize: 13, lineHeight: 20 },
});
