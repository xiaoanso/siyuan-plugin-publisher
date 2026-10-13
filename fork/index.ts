/**
 * 二开入口。宿主代码只从这里引入，不直接依赖 fork 内部文件。
 */
import { DockHost, type ShowDockHostOptions } from "./dockHost.ts"
import type { ForkPluginApi } from "./pluginApi.ts"

let dockHost: DockHost | null = null

export interface ForkHandle {
  /** 须在插件 onload 同步阶段调用 */
  onload(): void
  onunload(): void
}

export function installFork(plugin: ForkPluginApi): ForkHandle {
  dockHost = new DockHost(plugin)
  return {
    onload() {
      if (!plugin.isMobile) {
        dockHost?.register()
      }
    },
    onunload() {
      void dockHost?.close()
    },
  }
}

/** 桌面端由右侧 Dock 接管时返回 true；移动端与 forceMenu 返回 false，调用方继续走原 Menu。 */
export async function showForkIfDesktop(
  plugin: { isMobile: boolean },
  options: ShowDockHostOptions & { forceMenu?: boolean } = {}
): Promise<boolean> {
  if (!dockHost || plugin.isMobile || options.forceMenu) {
    return false
  }
  await dockHost.show(options)
  return true
}

export type { ShowDockHostOptions }
