import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { initDatabase } from '../db/client';
import { colors } from '../theme';

// 模块加载时同步初始化数据库（建表 + seed 内置类别），保证任何页面渲染前数据层可用
initDatabase();

export default function RootLayout() {
  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerTintColor: colors.text,
          headerStyle: { backgroundColor: colors.card },
          headerTitleStyle: { fontWeight: '600' },
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="record/bowel" options={{ title: '排便记录', presentation: 'modal' }} />
        <Stack.Screen name="record/sleep" options={{ title: '睡眠记录', presentation: 'modal' }} />
        <Stack.Screen name="record/mood" options={{ title: '个人状态', presentation: 'modal' }} />
        <Stack.Screen name="record/anxiety" options={{ title: '焦虑发作', presentation: 'modal' }} />
        <Stack.Screen name="day/[date]" options={{ title: '当日详情' }} />
        <Stack.Screen name="privacy" options={{ title: '隐私说明' }} />
      </Stack>
    </>
  );
}
