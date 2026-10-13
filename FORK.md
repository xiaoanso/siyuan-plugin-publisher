# 二开说明（Fork）

本仓库为 `terwer/siyuan-plugin-publisher` 的二开分支线。

## 分支与远程

| 名称 | 含义 |
|------|------|
| `main` | 尽量对齐上游，少放二开 |
| `release` | **二开主线**（右侧 Dock UI 等） |
| `origin` | 自己的 fork：`xiaoanso/siyuan-plugin-publisher` |
| `upstream` | 原作者：`terwer/siyuan-plugin-publisher` |

## 合入上游最新

```bash
git checkout release
git fetch upstream
git merge upstream/main
# 解决冲突 → git add … → git commit
git push origin release
```

## 冲突友好约定

二开全部放在 **`fork/`**，调用方只从 `fork/index.ts`（以及界面用的 `ForkAppFrame` / `useForkAppBridge`）引入：

```text
fork/
  index.ts              # installFork / showForkIfDesktop
  dockHost.ts           # 右侧 Dock 注册与打开
  DockShell.vue         # 图标轨布局
  ForkAppFrame.vue      # 包住现有 App，dock 时才出现左侧轨
  useForkAppBridge.ts   # Dock 内切视图
```

上游文件只留薄调用：`siyuan/index.ts`（`installFork`）、`pluginHost.ts`（`showForkIfDesktop`）、`createApp.ts`（`embedMode`）、`App.vue`（`ForkAppFrame` + `useForkAppBridge`）。

## UI 变更摘要

桌面端主入口改为思源 **右侧 Dock**（参考 sireader `addDock` + `DockShell`）：

- 顶栏 / 插件设置 / 文档菜单 → 打开右侧面板
- 面板内左侧图标轨切换：快速发布 / 详细 / 批量 / 管理 / 设置
- 移动端仍走原 Menu 浮层
