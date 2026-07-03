import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

let notificationReady = false;

/** 通知初始化：前台也展示横幅 + Android 通知渠道。幂等。 */
export async function ensureNotificationSetup(): Promise<void> {
  if (notificationReady) return;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('bowel-timer', {
      name: '排便计时提醒',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 300, 200, 300],
    });
  }
  notificationReady = true;
}

/**
 * 计时开始时预约提醒通知（start + minutes 时触发）。
 * 权限被拒绝时返回 null（App 前台仍有卡片内提醒兜底）。
 */
export async function scheduleBowelReminder(minutes: number): Promise<string | null> {
  await ensureNotificationSetup();
  const perm = await Notifications.requestPermissionsAsync();
  if (!perm.granted) return null;
  return Notifications.scheduleNotificationAsync({
    content: {
      title: '排便计时提醒',
      body: `本次已超过 ${minutes} 分钟，长时间如厕可能增加身体负担，建议结束休息一下。`,
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: minutes * 60,
      channelId: 'bowel-timer',
    },
  });
}

export async function cancelBowelReminder(notifId: string | null): Promise<void> {
  if (!notifId) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(notifId);
  } catch {
    // 通知可能已触发或被系统清理，忽略
  }
}
