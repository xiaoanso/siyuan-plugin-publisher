<template>
  <div v-if="enabled" class="fork-dock-root">
    <DockShell
      :tabs="tabs"
      :active-tab="activeTab"
      :nav-label="navLabel"
      nav-position="left"
      @select="onSelect"
    >
      <slot />
    </DockShell>
  </div>
  <slot v-else />
</template>

<script setup lang="ts">
import { computed, type Component } from "vue"
import { useAppI18n } from "~/src/ui/composables/useAppI18n.ts"
import type { HeaderNavEntry, HeaderNavKey } from "~/src/ui/composables/useHeaderNav.ts"
import LucideHouse from "~icons/lucide/house"
import LucideLayers from "~icons/lucide/layers"
import LucidePenLine from "~icons/lucide/pen-line"
import LucideRocket from "~icons/lucide/rocket"
import LucideSettings from "~icons/lucide/settings"
import DockShell, { type DockShellTab } from "./DockShell.vue"

/**
 * 右侧 Dock 外壳。非 dock 模式直接透出子内容，调用方不用改布局分支。
 */
const props = defineProps<{
  enabled: boolean
  currentView: string
  entries: HeaderNavEntry[]
  navLabel?: string
}>()

const emit = defineEmits<{
  (event: "select", key: HeaderNavKey, disabled: boolean): void
}>()

const { t } = useAppI18n()

const ICONS: Record<HeaderNavKey, Component> = {
  quick_publish: LucideRocket,
  single_publish: LucidePenLine,
  batch_publish: LucideLayers,
  manage: LucideHouse,
  settings: LucideSettings,
}

const LABEL_KEYS: Record<HeaderNavKey, string> = {
  quick_publish: "app.panel.quickPublish",
  single_publish: "panel.singlePublish",
  batch_publish: "panel.batchPublish",
  manage: "app.action.openManage",
  settings: "app.action.openSettings",
}

const activeTab = computed(() => (props.currentView === "ai_chat" ? "" : props.currentView))

const tabs = computed<DockShellTab[]>(() =>
  props.entries.map((entry) => ({
    id: entry.key,
    label: t(LABEL_KEYS[entry.key]),
    icon: ICONS[entry.key],
    disabled: entry.disabled,
    disabledReason: entry.disabledReasonKey ? t(entry.disabledReasonKey) : undefined,
  }))
)

function onSelect(id: string, disabled: boolean) {
  emit("select", id as HeaderNavKey, disabled)
}
</script>

<style scoped lang="stylus">
.fork-dock-root
  width 100%
  height 100%
  min-height 0
  display flex
  flex-direction column

  :deep(.syp-dock-shell)
    height 100%

  :deep(.syp-app)
    width 100%
    max-width none
    max-height none
    height 100%
    min-height 0

  :deep(.syp-panel)
    height 100%
    max-height none
    min-height 0
</style>
