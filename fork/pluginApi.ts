/**
 * 二开需要的插件能力。用结构类型，避免 fork → 插件入口的循环依赖。
 */
export interface ForkPluginApi {
  name: string
  isMobile: boolean
  i18n: Record<string, any>
  addIcons(svg: string): void
  addDock(options: {
    config: {
      position: "RightTop"
      size: { width: number; height: number }
      icon: string
      title: string
    }
    data: unknown
    type: string
    init: (this: { element: Element }) => void
    destroy?: () => void
    resize?: () => void
  }): void
}
