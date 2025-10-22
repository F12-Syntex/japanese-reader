import { computed, shallowReactive } from 'vue'
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

  const ctx = shallowReactive<{ pinia: Pinia | null }>({ pinia: resolvePinia() })

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

  const listLocal = (): string[] => {
    if (typeof window === 'undefined') return []
    const keys: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (k) keys.push(k)
    }
    return keys.sort((a, b) => a.localeCompare(b))
  }

  const localGet = (key: string): string | null => {
    if (typeof window === 'undefined') return null
    try {
      return localStorage.getItem(key)
    } catch {
      return null
    }
  }

  const localSet = (key: string, value: string): void => {
    if (typeof window === 'undefined') return
    localStorage.setItem(key, value)
  }

  const localRemove = (key: string): void => {
    if (typeof window === 'undefined') return
    localStorage.removeItem(key)
  }

  const localClearAll = (): void => {
    if (typeof window === 'undefined') return
    localStorage.clear()
  }

  const exportBundle = (): string => {
    const data: { stores: Record<string, unknown>; localStorage: Record<string, string | null> } = {
      stores: {},
      localStorage: {}
    }
    stores.value.forEach(s => {
      data.stores[s.id] = s.state
    })
    if (typeof window !== 'undefined') {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i)
        if (k) data.localStorage[k] = localStorage.getItem(k)
      }
    }
    return JSON.stringify(data, null, 2)
  }

  const importBundle = (json: string): void => {
    const parsed = JSON.parse(json) as { stores?: Record<string, unknown>; localStorage?: Record<string, string | null> }
    if (parsed.stores && typeof parsed.stores === 'object') {
      Object.entries(parsed.stores).forEach(([id, state]) => {
        patchState(id, (state || {}) as Record<string, unknown>)
      })
    }
    if (typeof window !== 'undefined' && parsed.localStorage && typeof parsed.localStorage === 'object') {
      Object.entries(parsed.localStorage).forEach(([k, v]) => {
        if (typeof v === 'string') localStorage.setItem(k, v)
        else localStorage.removeItem(k)
      })
    }
  }

  return {
    stores,
    getStore,
    patchState,
    tryResetOrClear,
    refreshStores,
    listLocal,
    localGet,
    localSet,
    localRemove,
    localClearAll,
    exportBundle,
    importBundle
  }
}