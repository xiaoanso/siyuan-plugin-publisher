/*
 *            GNU GENERAL PUBLIC LICENSE
 *               Version 3, 29 June 2007
 *
 *  Copyright (C) 2026 Terwer, Inc. <https://terwer.space/>
 *  Everyone is permitted to copy and distribute verbatim copies
 *  of this license document, but changing it is not allowed.
 */

/**
 * Dock 已挂载后，宿主再次 show() 时通过此总线通知 App 切视图，避免反复 unmount/mount。
 * 二开独占模块，合入上游时冲突面极小。
 *
 * 注意：不要从 createApp / App.vue 反向 import 运行时模块，以免循环依赖。
 */
export interface HostNavPayload {
  /** 单调递增，保证同内容也能触发订阅方 */
  seq: number
  initialView?: string
  initialSection?: string
  docId?: string
  autoPublishPlatformKey?: string
}

let seq = 0
type Listener = (payload: HostNavPayload) => void
const listeners = new Set<Listener>()

export function publishHostNav(partial: Omit<HostNavPayload, "seq">): HostNavPayload {
  const payload: HostNavPayload = {
    seq: ++seq,
    ...partial,
  }
  listeners.forEach((listener) => {
    try {
      listener(payload)
    } catch {
      // 单个监听失败不影响其它订阅方
    }
  })
  return payload
}

export function subscribeHostNav(listener: Listener): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
