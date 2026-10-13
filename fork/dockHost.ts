/*
 *            GNU GENERAL PUBLIC LICENSE
 *               Version 3, 29 June 2007
 *
 *  Copyright (C) 2026 Terwer, Inc. <https://terwer.space/>
 *  Everyone is permitted to copy and distribute verbatim copies
 *  of this license document, but changing it is not allowed.
 */

import { App as VueApp, nextTick } from "vue"
import { createSiyuanAppLogger } from "~/siyuan/appLogger.ts"
import { createApp, type InitialView } from "~/siyuan/host/createApp.ts"
import type { SettingsSection } from "~/src/ui/composables/useSettings.ts"
import { icons } from "~/siyuan/utils/svg.ts"
import {
  PUBLISHER_DOCK_ICON_ID,
  PUBLISHER_DOCK_TYPE,
  PUBLISHER_DOCK_WIDTH,
} from "./dockConstants.ts"
import { publishHostNav } from "./hostNavBus.ts"
import type { ForkPluginApi } from "./pluginApi.ts"

export interface ShowDockHostOptions {
  initialView?: InitialView
  initialSection?: SettingsSection
  docId?: string
  autoPublishPlatformKey?: string
}

/**
 * 右侧 Dock 宿主（二开）：参考 sireader `addDock` + `.dock__item` 打开方式。
 * 桌面端主入口走此处；移动端仍由 PluginHost Menu 回退。
 */
export class DockHost {
  private readonly logger
  private app: VueApp<Element> | null = null
  private mountPoint: HTMLElement | null = null
  private registered = false
  private themeObserver: MutationObserver | null = null
  private htmlDarkAddedByHost = false
  private pendingShow: ShowDockHostOptions | null = null

  constructor(private readonly pluginInstance: ForkPluginApi) {
    this.logger = createSiyuanAppLogger("dock-host")
  }

  public get dockDataType(): string {
    return `${this.pluginInstance.name}${PUBLISHER_DOCK_TYPE}`
  }

  /** 须在 onload 同步阶段调用（思源 addDock 约束） */
  public register(): void {
    if (this.registered) {
      return
    }
    this.registered = true

    this.pluginInstance.addIcons(this.buildDockIconSymbol())

    const self = this
    this.pluginInstance.addDock({
      config: {
        position: "RightTop",
        size: { width: PUBLISHER_DOCK_WIDTH, height: 0 },
        icon: PUBLISHER_DOCK_ICON_ID,
        title: this.resolveDockTitle(),
      },
      data: {
        plugin: this.pluginInstance,
      },
      type: PUBLISHER_DOCK_TYPE,
      // 与 sireader 一致：普通函数里 this 为 Dock，取 this.element
      init() {
        void self.onDockInit(this.element as HTMLElement)
      },
      destroy() {
        void self.onDockDestroy()
      },
      resize() {
        // Dock 尺寸由思源布局管理；面板内部用 flex 自适应
      },
    })

    this.logger.info("publisher right dock registered")
  }

  public async show(options: ShowDockHostOptions = {}): Promise<void> {
    this.pendingShow = options
    this.openDockPanel()

    if (this.app) {
      publishHostNav({
        initialView: options.initialView,
        initialSection: options.initialSection,
        docId: options.docId,
        autoPublishPlatformKey: options.autoPublishPlatformKey,
      })
      this.pendingShow = null
      return
    }

    // init 尚未完成：pendingShow 会在 onDockInit 末尾消费
    await nextTick()
  }

  public async close(): Promise<void> {
    this.closeDockPanel()
  }

  public isOpen(): boolean {
    const btn = this.queryDockButton()
    return !!btn?.classList.contains("dock__item--active")
  }

  private async onDockInit(element: HTMLElement): Promise<void> {
    const container = document.createElement("div")
    container.className = "publisher-dock-content"
    container.style.cssText = "width:100%;height:100%;overflow:hidden;display:flex;flex-direction:column;"
    element.appendChild(container)
    this.mountPoint = container

    this.startHostThemeObserver()

    const options = this.pendingShow ?? { initialView: "quick_publish" as InitialView }
    this.pendingShow = null

    try {
      const app = this.mountApp(options)
      this.app = app
      this.logger.info("publisher dock panel mounted")
    } catch (e) {
      this.logger.error("Failed to mount dock panel:", e)
      await this.onDockDestroy()
      throw e
    }
  }

  private async onDockDestroy(): Promise<void> {
    this.teardownHtmlDarkSync()
    const app = this.app
    const mountPoint = this.mountPoint
    this.app = null
    this.mountPoint = null
    if (app) {
      app.unmount()
    }
    mountPoint?.remove()
    await nextTick()
  }

  private mountApp(options: ShowDockHostOptions): VueApp<Element> {
    if (!this.mountPoint) {
      throw new Error("dock mount point missing")
    }

    const app = createApp({
      initialView: options.initialView ?? "quick_publish",
      initialSection: options.initialSection,
      docId: options.docId,
      autoPublishPlatformKey: options.autoPublishPlatformKey,
      embedMode: "dock",
      locale: "plugin",
      messages: {
        plugin: this.pluginInstance.i18n,
      },
      fallbackResolve: (key: string) => this.resolvePluginI18nKey(key),
      onClose: () => {
        void this.close()
      },
    })

    this.mountPoint.classList.toggle("dark", DockHost.isHostDarkMode())
    app.mount(this.mountPoint)
    return app
  }

  private openDockPanel(): void {
    const btn = this.queryDockButton()
    if (!btn) {
      this.logger.warn("dock button not found; layout may not be ready yet")
      return
    }
    if (!btn.classList.contains("dock__item--active")) {
      btn.click()
    }
  }

  private closeDockPanel(): void {
    const btn = this.queryDockButton()
    if (!btn) {
      return
    }
    if (btn.classList.contains("dock__item--active")) {
      btn.click()
    }
  }

  private queryDockButton(): HTMLElement | null {
    return document.querySelector<HTMLElement>(`.dock__item[data-type="${this.dockDataType}"]`)
  }

  private resolveDockTitle(): string {
    const i18n = this.pluginInstance.i18n as Record<string, string> | undefined
    return i18n?.publishTool || i18n?.["app.brand"] || "Publisher"
  }

  private buildDockIconSymbol(): string {
    // icons.iconPlane 是完整 <svg>...</svg>，抽 path 塞进 symbol
    const plane = icons.iconPlane
    const pathMatch = plane.match(/<path[^>]*>/)
    const path = pathMatch?.[0] ?? `<path d="M16.1 260.2c-22.6 12.9-20.5 47.3 3.6 57.3L160 376V479.3c0 18.1 14.6 32.7 32.7 32.7c9.7 0 18.9-4.3 25.1-11.8l62-74.3 123.9 51.6c18.9 7.9 40.8-4.5 43.9-24.7l64-416c1.9-12.1-3.4-24.3-13.5-31.2s-23.3-7.5-34-1.4l-448 256zm52.1 25.5L409.7 90.6 190.1 336l1.2 1L68.2 285.7zM403.3 425.4L236.7 355.9 450.8 116.6 403.3 425.4z"/>`
    return `<symbol id="${PUBLISHER_DOCK_ICON_ID}" viewBox="0 0 512 512">${path}</symbol>`
  }

  private static isHostDarkMode(): boolean {
    return document.documentElement.getAttribute("data-theme-mode") === "dark"
  }

  private syncHtmlDarkFromHostTheme(): void {
    const html = document.documentElement
    const hostDark = DockHost.isHostDarkMode()

    this.mountPoint?.classList.toggle("dark", hostDark)

    if (hostDark) {
      if (!html.classList.contains("dark")) {
        html.classList.add("dark")
        this.htmlDarkAddedByHost = true
      }
      return
    }

    if (this.htmlDarkAddedByHost) {
      html.classList.remove("dark")
      this.htmlDarkAddedByHost = false
    }
  }

  private startHostThemeObserver(): void {
    this.stopHostThemeObserver()
    this.syncHtmlDarkFromHostTheme()
    this.themeObserver = new MutationObserver(() => {
      this.syncHtmlDarkFromHostTheme()
    })
    this.themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme-mode", "class"],
    })
  }

  private stopHostThemeObserver(): void {
    if (this.themeObserver) {
      this.themeObserver.disconnect()
      this.themeObserver = null
    }
  }

  private teardownHtmlDarkSync(): void {
    this.stopHostThemeObserver()
    if (this.htmlDarkAddedByHost) {
      document.documentElement.classList.remove("dark")
      this.htmlDarkAddedByHost = false
    }
  }

  private resolvePluginI18nKey(key: string) {
    const messages = this.pluginInstance.i18n as Record<string, any> | undefined
    if (!key || !messages) {
      return undefined
    }
    if (Object.prototype.hasOwnProperty.call(messages, key) && typeof messages[key] === "string") {
      return messages[key]
    }
    if (!key.includes(".")) {
      return undefined
    }
    const nestedValue = key.split(".").reduce<any>((current, part) => {
      if (current && typeof current === "object" && Object.prototype.hasOwnProperty.call(current, part)) {
        return current[part]
      }
      return undefined
    }, messages)
    return typeof nestedValue === "string" ? nestedValue : undefined
  }
}
