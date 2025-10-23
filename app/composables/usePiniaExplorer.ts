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

/* ---------------------------------------------------
   Config
--------------------------------------------------- */
const MAX_STORE_SIZE_MB = 3
const MAX_STORE_SIZE_BYTES = MAX_STORE_SIZE_MB * 1024 * 1024

/* fast skip predicate — no JSON.stringify */
const isMassiveObject = (obj: unknown): boolean => {
  if (!obj) return false
  // skip certain huge known structures
  const keys = Object.keys(obj as Record<string, unknown>)
  if (keys.length > 5000) return true // many keys = likely large
  // dictionaries often have "words" or "entries" arrays
  if ('words' in (obj as Record<string, unknown>)) return true
  if ('kanji' in (obj as Record<string, unknown>) && (obj as any).kanji?.length > 1000) return true
  return false
}

/* ---------------------------------------------------
   Composable
--------------------------------------------------- */
export const usePiniaExplorer = () => {
  const resolvePinia = (): Pinia | null => {
    const active = getActivePinia()
    if (active) return active
    const nuxt = useNuxtApp()
    return (nuxt as unknown as { $pinia?: Pinia }).$pinia ?? null
  }

  const ctx = shallowReactive<{ pinia: Pinia | null }>({
    pinia: resolvePinia(),
  })

  /* ----------------- List all stores ----------------- */
  const stores = computed<StoreMeta[]>(() => {
    const p = ctx.pinia as unknown as {
      _s?: Map<string, AnyStore>
      state?: { value?: Record<string, StateTree> }
    } | null

    if (!p || !p._s) return []
    const root = (p.state?.value ?? {}) as Record<string, unknown>
    const list: StoreMeta[] = []

    p._s.forEach((store, key) => {
      const id = store?.$id || key
      if (!id) return
      const state = (root[id] as Record<string, unknown>) ?? {}

      // ✅ Quick size & name check: skip dictionary‑like or massive state entirely
      if (id.toLowerCase().includes('dict') || id.toLowerCase().includes('dictionary')) return
      if (isMassiveObject(state)) return

      list.push({ id, state })
    })

    return list.sort((a, b) => a.id.localeCompare(b.id))
  })

  /* ----------------- Store access helpers ----------------- */
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
    } else {
      const root = (ctx.pinia as any)?.state?.value
      if (root && root[id]) Object.assign(root[id], partial)
    }
  }

  const tryResetOrClear = (id: string): void => {
    const inst = getStore(id)
    if (!inst) return

    if (typeof inst.$reset === 'function') {
      inst.$reset()
      return
    }

    const clearCandidates = [
      'clear',
      'reset',
      'clearCache',
      'clearAnkiData',
      'resetToSystem',
      'load',
      'loadCache',
    ]
    for (const fnName of clearCandidates) {
      const fn = (inst as Record<string, unknown>)[fnName]
      if (typeof fn === 'function' && (fn as Function).length === 0) {
        ;(fn as () => unknown)()
      }
    }

    const root = (ctx.pinia as any)?.state?.value
    const curr = root?.[id]
    if (curr && typeof curr === 'object') {
      for (const k of Object.keys(curr)) (curr[k] = null)
    }
  }

  const refreshStores = (): void => {
    ctx.pinia = resolvePinia()
  }

  /* ----------------- LocalStorage utils (skip >3 MB) ----------------- */
  const safeRead = (key: string): string | null => {
    try {
      const val = localStorage.getItem(key)
      if (!val) return null
      if (val.length * 2 > MAX_STORE_SIZE_BYTES) return null // rough 2B per char
      return val
    } catch {
      return null
    }
  }

  const listLocal = (): string[] => {
    if (typeof window === 'undefined') return []
    const keys: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (!k) continue
      const val = localStorage.getItem(k)
      if (val && val.length * 2 < MAX_STORE_SIZE_BYTES) keys.push(k)
    }
    return keys.sort((a, b) => a.localeCompare(b))
  }

  const localGet = (key: string): string | null => (typeof window === 'undefined' ? null : safeRead(key))
  const localSet = (key: string, value: string): void => {
    if (typeof window === 'undefined') return
    if (value.length * 2 > MAX_STORE_SIZE_BYTES) {
      console.warn(`[PiniaExplorer] Skipped saving ${key}: value > ${MAX_STORE_SIZE_MB} MB`)
      return
    }
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

  /* ----------------- Export / Import ----------------- */
  const exportBundle = (): string => {
    const data: { stores: Record<string, unknown>; localStorage: Record<string, string | null> } = {
      stores: {},
      localStorage: {},
    }

    stores.value.forEach(s => {
      if (!isMassiveObject(s.state)) data.stores[s.id] = s.state
    })

    if (typeof window !== 'undefined') {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i)
        if (!k) continue
        const val = safeRead(k)
        if (val) data.localStorage[k] = val
      }
    }

    return JSON.stringify(data, null, 2)
  }

  const importBundle = (json: string): void => {
    const parsed = JSON.parse(json) as {
      stores?: Record<string, unknown>
      localStorage?: Record<string, string | null>
    }

    if (parsed.stores) {
      for (const [id, st] of Object.entries(parsed.stores)) {
        if (isMassiveObject(st)) continue
        patchState(id, st as Record<string, unknown>)
      }
    }

    if (parsed.localStorage && typeof window !== 'undefined') {
      for (const [k, v] of Object.entries(parsed.localStorage)) {
        if (v && v.length * 2 < MAX_STORE_SIZE_BYTES) localStorage.setItem(k, v)
      }
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
    importBundle,
  }
}