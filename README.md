# 个人健康记录 App（health-tracker）

本地优先的个人健康记录 Android App（MVP）。记录每日排便、排尿、睡眠、个人状态、焦虑发作与备注，支持日/周/月统计与 JSON/CSV 导出。数据默认只保存在本机，不联网、无账号、无云同步。

需求与开发计划见：
- `docs/`（验收报告、小程序端接入预留说明）
- 原始需求文档与开发计划位于 `~/Documents/Codex/2026-07-03/xie/outputs/`

## Monorepo 结构

```
health-tracker/
  apps/
    mobile/          # Expo React Native App（Android MVP，未来 iOS 复用同一套代码）
      src/app/       # expo-router 路由（(tabs)/今日|统计|设置、record/*、day/[date]、privacy）
      src/components # UI 组件（计数卡片、选择器、日历、柱状图等）
      src/db/        # SQLite 适配层（client/seed/repo）
      src/stores/    # zustand 状态
      src/features/  # 导出等业务功能
  packages/
    core/            # 平台无关：类型、本地时区日期工具、日/周/月统计、JSON/CSV 导出、表单校验（含单测）
    ui-schema/       # 内置类别 seed + 表单字段 schema（未来自定义类别沿用同一结构）
  docs/
```

`packages/core` 与 `packages/ui-schema` 不依赖 React Native，可被未来的 Taro 小程序端 / 飞书 H5 直接复用；各端只需实现自己的存储 adapter 和 UI（见 `docs/miniapp-integration.md`）。

## 开发

要求：Node ≥ 20、pnpm。

```bash
pnpm install
pnpm --filter mobile start        # 启动 Expo 开发服务
pnpm --filter @health-tracker/core test   # core 单元测试
pnpm -r typecheck                 # 全仓类型检查
```

## 构建 Android APK（本地）

要求：JDK 17、Android SDK（platform-tools / platforms;android-36 / build-tools;36.0.0 / NDK）。

```bash
cd apps/mobile
npx expo prebuild --platform android --no-install   # 生成 android/ 原生工程（已生成可跳过）
cd android
export JAVA_HOME=/opt/homebrew/opt/openjdk@17
export ANDROID_HOME=$HOME/Library/Android/sdk
./gradlew assembleRelease
# 产物：android/app/build/outputs/apk/release/app-release.apk
```

也可以使用 EAS Build 云构建（需要 Expo 账号）：`npx eas build -p android --profile preview`。

注意：MVP 的 release 构建使用 debug keystore 签名，仅适合个人安装；上架前需要生成正式签名。

## 隐私

- 所有数据存本机 SQLite，不默认联网，不接入广告/统计 SDK。
- 导出 JSON/CSV 由用户主动触发，经系统分享面板发出。
