<template>
  <div class="syp-dock-shell" :class="`nav-${navPosition}`">
    <nav v-if="tabs.length" class="syp-dock-shell__nav" :aria-label="navLabel">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        type="button"
        class="syp-dock-shell__tab"
        :class="{ 'is-active': tab.id === activeTab, 'is-disabled': tab.disabled }"
        :aria-label="tab.label"
        :aria-current="tab.id === activeTab ? 'page' : undefined"
        :aria-disabled="tab.disabled ? 'true' : undefined"
        :title="tab.disabled && tab.disabledReason ? tab.disabledReason : tab.label"
        @click="onTabClick(tab)"
      >
        <component :is="tab.icon" class="syp-dock-shell__tab-icon" />
      </button>
    </nav>

    <main class="syp-dock-shell__content">
      <div v-if="$slots.toolbar" class="syp-dock-shell__toolbar">
        <slot name="toolbar" />
      </div>
      <div class="syp-dock-shell__body" :class="bodyClass">
        <slot />
      </div>
      <slot name="overlay" />
    </main>
  </div>
</template>

<script setup lang="ts">
import type { Component } from "vue"

/**
 * 右侧 Dock 内容壳：参考 siyuan-sireader `DockShell`。
 * 图标竖向导航 + 主内容区；navPosition 支持 left/right。
 */
export interface DockShellTab {
  id: string
  label: string
  icon: Component
  disabled?: boolean
  disabledReason?: string
}

const props = withDefaults(
  defineProps<{
    activeTab?: string
    tabs?: DockShellTab[]
    navPosition?: "left" | "right"
    navLabel?: string
    bodyClass?: string
  }>(),
  {
    tabs: () => [],
    navPosition: "left",
    navLabel: "导航",
  }
)

const emit = defineEmits<{
  (event: "update:activeTab", id: string): void
  (event: "select", id: string, disabled: boolean): void
}>()

function onTabClick(tab: DockShellTab) {
  emit("select", tab.id, !!tab.disabled)
  if (tab.disabled) {
    return
  }
  emit("update:activeTab", tab.id)
}
</script>

<style scoped lang="stylus">
@import "../src/ui/assets/variables.styl"

.syp-dock-shell
  position relative
  display flex
  height 100%
  width 100%
  overflow hidden
  background var(--b3-theme-background, $syp-bg-primary)

  &.nav-left
    flex-direction row

  &.nav-right
    flex-direction row-reverse

.syp-dock-shell__nav
  display flex
  flex-direction column
  flex-shrink 0
  width 42px
  padding 8px 0
  background var(--b3-theme-background, $syp-bg-primary)

.nav-left .syp-dock-shell__nav
  border-right 1px solid var(--b3-theme-background-light, $syp-border-primary)

.nav-right .syp-dock-shell__nav
  border-left 1px solid var(--b3-theme-background-light, $syp-border-primary)

.syp-dock-shell__tab
  display flex
  align-items center
  justify-content center
  width 100%
  padding 10px 8px
  border none
  background transparent
  color var(--b3-theme-on-surface, $syp-text-secondary)
  cursor pointer
  transition var(--b3-transition, color 0.15s ease, background 0.15s ease)

  &:hover
    color var(--b3-theme-on-background, $syp-text-primary)
    background var(--b3-list-hover, $syp-accent-hover-bg)

  &.is-active
    color var(--b3-theme-primary, $syp-primary)

  &.is-disabled
    opacity 0.4
    cursor not-allowed

    &:hover
      color var(--b3-theme-on-surface, $syp-text-secondary)
      background transparent

.syp-dock-shell__tab-icon
  width 16px
  height 16px
  flex-shrink 0

.syp-dock-shell__content
  flex 1
  min-width 0
  min-height 0
  display flex
  flex-direction column
  overflow hidden

.syp-dock-shell__toolbar
  display flex
  align-items center
  gap 6px
  padding 6px 8px
  flex-shrink 0
  border-bottom 1px solid var(--b3-border-color, $syp-border-primary)

.syp-dock-shell__body
  flex 1
  min-height 0
  overflow auto
</style>
