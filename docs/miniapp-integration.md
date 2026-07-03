# Taro 小程序端接入预留说明

MVP 只交付 Android App（`apps/mobile`）。本文档记录后续接入小程序端（微信小程序 / 飞书 H5）的方式，对应开发计划 v1.6。

## 目录约定

```
apps/
  miniapp/            # 后续创建：Taro + React
    src/
    config/
    project.config.json
```

创建方式：在仓库根目录执行 `pnpm dlx @tarojs/cli init miniapp`，然后把生成目录移到 `apps/miniapp` 并加入 workspace（`pnpm-workspace.yaml` 已用 `apps/*` 通配，无需改动）。

## 可直接复用的部分（packages/*，均不依赖 React Native）

| 模块 | 内容 |
| --- | --- |
| `@health-tracker/core` types | RecordCategory / RecordEntry / DailyNote / 各类 payload 类型 |
| `@health-tracker/core` dates | 本地时区 dateKey、周/月区间、时长格式化 |
| `@health-tracker/core` stats | 日/周/月统计函数（计数、时长、事件、评分） |
| `@health-tracker/core` export | JSON / CSV 导出格式 |
| `@health-tracker/core` validation | 表单校验规则 |
| `@health-tracker/ui-schema` | 内置类别定义、表单字段 schema、评分文案、时长快捷选项 |

## 小程序端需要自己实现的部分

1. **存储 adapter**：小程序没有 SQLite，用 `Taro.setStorage` 或 IndexedDB（H5）实现与 `apps/mobile/src/db/repo.ts` 相同的接口（`getRecordsByDate` / `insertRecord` / `updateRecord` / `deleteRecord` / `getDailyNote` / `upsertDailyNote` / 范围查询）。建议先抽一个 `RecordRepository` 接口放入 `packages/core`，两端各自实现。
2. **UI 与路由**：页面独立实现，不复用 React Native 组件；统计图可用小程序 canvas 或列表替代。
3. **导出能力**：微信小程序无法直接保存任意文件，可先做「复制 JSON 到剪贴板」或云端中转（需用户明确授权）。
4. **飞书 H5**：可用 Taro 的 H5 编译目标，套飞书 JSSDK 鉴权；数据仍走本地 storage 或后续的同步服务。

## 优先级建议（与开发计划一致）

1. 查看记录（只读）→ 2. 新增记录 → 3. 统计 → 4. 导入导出。
