import { computed, reactive } from 'vue'
import type { Pinia, StateTree } from 'pinia'
import { getActivePinia } from 'pinia'
import { useNuxtApp } from '#app'

interface StoreMeta {
  id: string
  state: Record<string, unknown>
}

type AnyStore = {
  $id: string
  $patch?: (partial: Partial<StateTree>) => void
  $reset?: () => void
} & Record<string, unknown>

export const usePiniaExplorer = () => {
  const resolvePinia = (): Pinia | null => {
    const active = getActivePinia()
    if (active) return active
    const nuxt = useNuxtApp()
    const p = (nuxt as unknown as { $pinia?: Pinia }).$pinia
    return p ?? null
  }

  const ctx = reactive<{ pinia: unknown }>({ pinia: resolvePinia() })

  const stores = computed<StoreMeta[]>(() => {
    const p = ctx.pinia as unknown as { _s?: Map<string, AnyStore>; state?: { value?: Record<string, StateTree> } } | null
    if (!p || !p._s) return []
    const map = p._s
    const root = (p.state?.value ?? {}) as Record<string, unknown>
    const list: StoreMeta[] = []
    map.forEach((store, key) => {
      const id = store?.$id || key
      if (!id) return
      list.push({ id, state: (root[id] as Record<string, unknown>) ?? {} })
    })
    return list.sort((a, b) => a.id.localeCompare(b.id))
  })

  const getStore = (id: string): AnyStore | null => {
    const p = ctx.pinia as unknown as { _s?: Map<string, AnyStore> } | null
    if (!p || !p._s) return null
    return p._s.get(id) ?? null
  }

  const patchState = async (id: string, partial: Record<string, unknown>): Promise<void> => {
    const inst = getStore(id)
    if (!inst) return
    if (typeof inst.$patch === 'function') {
      inst.$patch(partial as Partial<StateTree>)
      return
    }
    const p = ctx.pinia as unknown as { state?: { value?: Record<string, StateTree> } } | null
    const root = p?.state?.value
    if (root && root[id]) {
      Object.assign(root[id], partial)
    }
  }

  const tryResetOrClear = (id: string): void => {
    const inst = getStore(id)
    if (!inst) return
    if (typeof inst.$reset === 'function') {
      inst.$reset()
      return
    }
    const candidates = [
      'clear',
      'reset',
      'resetScores',
      'clearCache',
      'clearAnkiData',
      'resetToSystem',
      'load',
      'loadCache'
    ]
    for (const name of candidates) {
      const fn = (inst as Record<string, unknown>)[name]
      if (typeof fn === 'function' && (fn as (...a: unknown[]) => unknown).length === 0) {
        ;(fn as () => unknown)()
      }
    }
    const p = ctx.pinia as unknown as { state?: { value?: Record<string, StateTree> } } | null
    const root = p?.state?.value
    if (root && root[id]) {
      const curr = root[id] as Record<string, unknown>
      Object.keys(curr).forEach(k => {
        const v = curr[k]
        if (Array.isArray(v)) curr[k] = [] as unknown
        else if (v instanceof Map) curr[k] = new Map() as unknown
        else if (v instanceof Set) curr[k] = new Set() as unknown
        else if (v !== null && typeof v === 'object') curr[k] = {} as unknown
        else if (typeof v === 'number') curr[k] = 0 as unknown
        else if (typeof v === 'boolean') curr[k] = false as unknown
        else curr[k] = '' as unknown
      })
    }
  }

  const refreshStores = (): void => {
    ctx.pinia = resolvePinia()
  }

  return {
    stores,
    getStore,
    patchState,
    tryResetOrClear,
    refreshStores
  }
}