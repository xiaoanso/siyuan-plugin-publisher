# Fork：UI 布局样式收拢到 `fork/styles`

日期：2026-10-13  
分支：`release`

## 目标

把二开布局样式从上游 UI 文件挪到 `fork/styles/ui-overrides.styl`，合入 `upstream/main` 时少碰 `base.styl` / 设置组件。

## 策略

| 区域 | 做法 |
|------|------|
| `fork/styles/ui-overrides.styl` | 二开独占：设置顶栏导航、图床列宽、Cookie 面板响应式 |
| `fork/ForkAppFrame.vue` | `import "./styles/ui-overrides.styl"`（始终加载，与 dock 开关无关） |
| `src/ui/assets/base.styl` 等 | 还原为上游；不再堆二开布局 |
| `App.vue` | 仅保留既有薄挂钩（`ForkAppFrame` / bridge） |

覆盖选择器统一用 `.syp-app .syp-panel …`，压过上游全局规则与 Vue scoped（避免依赖 CSS 加载顺序）。

## 验收

- [x] `pnpm build` 通过（2026-10-13）
- [ ] 设置页顶栏横向导航（非左侧栏）— 宿主手验
- [ ] 图床左侧列表随内容收缩 — 宿主手验
- [ ] Cookie 授权条窄宽下按钮可换行 — 宿主手验
