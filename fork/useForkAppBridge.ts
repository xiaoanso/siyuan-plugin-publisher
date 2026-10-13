import { onBeforeUnmount, onMounted, type Ref } from "vue"
import type { AppView } from "~/src/ui/components/layout/UnifiedWorkspaceShell.vue"
import { subscribeHostNav, type HostNavPayload } from "./hostNavBus.ts"

const DOC_VIEWS = new Set(["quick_publish", "single_publish", "batch_publish"])

export interface ForkAppBridgeContext {
  embedMode: () => string | undefined
  docId: Ref<string | undefined>
  currentView: Ref<AppView>
  setSection: (section: string) => Promise<void>
  initDoc: (docId?: string) => Promise<void>
  publishByKey: (platformKey: string) => void
}

/**
 * Dock 已打开时，后续 show() 通过 hostNavBus 切视图，而不是反复挂载 Vue。
 * App.vue 只负责把已有的设置/发布能力传进来。
 */
export function useForkAppBridge(ctx: ForkAppBridgeContext): void {
  let unsubscribe: (() => void) | undefined

  onMounted(() => {
    if (ctx.embedMode() !== "dock") {
      return
    }
    unsubscribe = subscribeHostNav((payload) => {
      void applyForkHostNav(ctx, payload)
    })
  })

  onBeforeUnmount(() => {
    unsubscribe?.()
    unsubscribe = undefined
  })
}

async function applyForkHostNav(ctx: ForkAppBridgeContext, payload: HostNavPayload): Promise<void> {
  if (payload.docId !== undefined) {
    ctx.docId.value = payload.docId
  }
  if (payload.initialSection) {
    await ctx.setSection(payload.initialSection)
  }
  const nextView = (payload.initialView as AppView | undefined) ?? "quick_publish"
  ctx.currentView.value = nextView
  if (DOC_VIEWS.has(nextView)) {
    await ctx.initDoc(ctx.docId.value)
  }
  if (payload.autoPublishPlatformKey && nextView === "quick_publish") {
    ctx.publishByKey(payload.autoPublishPlatformKey)
  }
}
