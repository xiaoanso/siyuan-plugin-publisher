# Fork 二开：右侧 Dock UI + 上游合入策略

日期：2026-10-13  
分支：`release`（二开主线）  
基线：`main` @ `c10c4ea3`（v2.2.0）

## 目标

1. **二开可合上游**：能持续拉取 `terwer/siyuan-plugin-publisher` 最新代码，自定义改动尽量不被覆盖，冲突面可控。
2. **UI 部署改为右侧 Dock**：参考 `siyuan-sireader` 的 `addDock` + `DockShell`，设置/主界面从右侧面板展开，而不是顶栏 Menu 浮层。

## Git 工作流（固化）

| 远程 | 用途 |
|------|------|
| `origin` | 自己的 fork（`xiaoanso/siyuan-plugin-publisher`），推 `release` |
| `upstream` | 原作者仓库（`terwer/siyuan-plugin-publisher`），只拉不推 |

```bash
# 日常开发
git checkout release
# ... 改代码、提交 ...

# 合入上游最新（推荐 merge，冲突一次解决、历史清晰）
git fetch upstream
git merge upstream/main
# 解决冲突后：git add ... && git commit

# 推送到自己的 fork
git push -u origin release
```

原则：

- **`main` 跟踪上游**，尽量保持与 `upstream/main` 一致（或仅作镜像），不要在 `main` 堆二开。
- **所有二开只在 `release`**。
- 二开改动全部落在 **`fork/`**，上游文件只做薄挂钩（从 `fork/index.ts` 引入后调用），降低合并冲突。

## 冲突友好分区

| 区域 | 策略 |
|------|------|
| `fork/**` | **二开独占**。入口 `fork/index.ts` |
| `siyuan/index.ts` | `installFork(this)` + `fork.onload/onunload` |
| `siyuan/host/pluginHost.ts` | `showForkIfDesktop(...)` |
| `src/ui/components/App.vue` | `ForkAppFrame` + `useForkAppBridge` |
| 适配器 / 传输层 / 平台 checklist | **尽量不改**，跟上游走 |

## UI 方案

参考 sireader：

- `plugin.addDock({ config: { position: 'RightTop', ... }, type, init })`
- 打开：点击 `.dock__item[data-type="${plugin.name}${type}"]`
- 内部布局：`DockShell`（图标导航 + 内容区），设置页从右侧 Dock 进入

行为：

- 顶栏按钮 → 打开/聚焦右侧 Dock（快速发布）
- 思源「插件设置」→ 打开 Dock 并切到设置视图
- 文档块菜单一键发布 / AI → 打开 Dock 并带上对应 `initialView` / `docId` / `autoPublishPlatformKey`
- 移动端：保留原 Menu / fullscreen 回退（空间不足时 Dock 体验差）

## 验收

- [x] `pnpm build` 通过（2026-10-13）
- [ ] 宿主：右侧出现发布 Dock，顶栏可打开
- [ ] 设置分区可在 Dock 内切换
- [ ] 文档菜单快速发布仍可用
- [x] `git fetch upstream && git merge upstream/main` 流程已写入 `FORK.md`
