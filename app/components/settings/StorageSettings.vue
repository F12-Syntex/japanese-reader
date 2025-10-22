<template>
  <div class="space-y-6 px-2 md:px-0">
    <div class="card bg-base-200/50 border border-base-300">
      <div class="card-body p-4 md:p-6">
        <div class="flex items-center justify-between gap-3 mb-4">
          <h3 class="text-base font-bold flex items-center gap-2">
            <IconDatabase class="w-5 h-5" />
            Storage
          </h3>
          <div class="join w-full md:w-1/2">
            <input v-model="query" type="text" placeholder="Search stores..." class="input input-bordered input-sm w-full join-item" />
            <button @click="refresh()" class="btn btn-ghost btn-sm join-item">
              <IconRefreshCw class="w-4 h-4" />
            </button>
          </div>
        </div>

        <div class="space-y-3">
          <div v-if="filteredStores.length === 0" class="flex flex-col items-center justify-center py-12 text-center">
            <IconSearch class="w-12 h-12 text-base-content/20 mb-4" />
            <p class="text-sm text-base-content/60">No stores found</p>
          </div>

          <div v-for="s in filteredStores" :key="s.id" class="collapse collapse-arrow bg-base-100 border border-base-300">
            <input type="checkbox" />
            <div class="collapse-title text-sm font-semibold flex items-center justify-between gap-2">
              <div class="flex items-center gap-2">
                <span class="badge badge-primary badge-sm">{{ s.id }}</span>
                <span class="text-xs text-base-content/60">keys: {{ Object.keys(s.state || {}).length }}</span>
              </div>
              <div class="flex items-center gap-2">
                <span v-if="parseErrors[s.id]" class="badge badge-error badge-xs">Invalid JSON</span>
              </div>
            </div>
            <div class="collapse-content">
              <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div class="space-y-3">
                  <div class="form-control">
                    <label class="label">
                      <span class="label-text font-medium text-sm">State JSON</span>
                    </label>
                    <textarea
                      v-model="editors[s.id]"
                      class="textarea textarea-bordered font-mono text-xs min-h-[220px]"
                      spellcheck="false"
                    ></textarea>
                  </div>

                  <div class="flex flex-wrap gap-2">
                    <button
                      @click="saveState(s.id)"
                      class="btn btn-primary btn-sm gap-2"
                      :disabled="!!parseErrors[s.id] || savingId === s.id"
                    >
                      <span v-if="savingId === s.id" class="loading loading-spinner loading-xs"></span>
                      <IconSave v-else class="w-4 h-4" />
                      Save
                    </button>
                    <button
                      @click="reloadEditor(s.id)"
                      class="btn btn-ghost btn-sm gap-2"
                    >
                      <IconRotateCcw class="w-4 h-4" />
                      Reload
                    </button>
                    <button
                      @click="resetOrClear(s.id)"
                      class="btn btn-error btn-outline btn-sm gap-2"
                    >
                      <IconTrash class="w-4 h-4" />
                      Clear
                    </button>
                  </div>
                </div>

                <div class="space-y-3">
                  <div class="form-control">
                    <label class="label">
                      <span class="label-text font-medium text-sm">Quick Actions</span>
                    </label>
                    <div class="flex flex-wrap gap-2">
                      <button
                        v-for="a in zeroArgActions(s.id)"
                        :key="s.id + '-' + a"
                        @click="callAction(s.id, a)"
                        class="btn btn-sm gap-2"
                      >
                        <IconPlay class="w-4 h-4" />
                        {{ a }}
                      </button>
                    </div>
                  </div>

                  <div class="divider my-2"></div>

                  <div class="form-control">
                    <label class="label">
                      <span class="label-text font-medium text-sm">Local Storage (matching)</span>
                    </label>
                    <div class="space-y-2">
                      <div v-if="matchedLocalKeys(s.id).length === 0" class="text-xs text-base-content/60">No matching keys</div>
                      <div v-else class="space-y-2">
                        <div class="flex flex-wrap gap-2">
                          <button
                            v-for="k in matchedLocalKeys(s.id)"
                            :key="k"
                            @click="removeLocalKey(k)"
                            class="btn btn-error btn-outline btn-xs gap-2"
                            :title="localStorageValuePreview(k)"
                          >
                            <IconTrash class="w-3 h-3" />
                            {{ k }}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div class="divider my-2"></div>

                  <div class="form-control">
                    <label class="label">
                      <span class="label-text font-medium text-sm">State Preview</span>
                    </label>
                    <pre class="p-3 rounded border border-base-300 bg-base-200/50 overflow-x-auto text-xs">{{ prettyState(s.state) }}</pre>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="divider"></div>

          <div class="alert alert-info text-xs">
            <IconInfo class="w-4 h-4" />
            <span>Use collapsible sections and tabs from DaisyUI to manage UI density</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import IconDatabase from '~icons/lucide/database'
import IconSearch from '~icons/lucide/search'
import IconSave from '~icons/lucide/save'
import IconRotateCcw from '~icons/lucide/rotate-ccw'
import IconTrash from '~icons/lucide/trash-2'
import IconPlay from '~icons/lucide/play'
import IconRefreshCw from '~icons/lucide/refresh-cw'
import IconInfo from '~icons/lucide/info'
import { onMounted, reactive, ref, computed, watch } from 'vue'

const { stores, getStore, patchState, tryResetOrClear, refreshStores } = usePiniaExplorer()

const query = ref<string>('')
const editors = reactive<Record<string, string>>({})
const parseErrors = reactive<Record<string, string | null>>({})
const savingId = ref<string>('')

const filteredStores = computed(() => {
  const q = query.value.trim().toLowerCase()
  const arr = stores.value
  if (!q) return arr
  return arr.filter(s => s.id.toLowerCase().includes(q))
})

const pretty = (v: unknown): string => {
  try {
    return JSON.stringify(v, (_k, val) => {
      if (val instanceof Map) return { _type: 'Map', value: Array.from(val.entries()) }
      if (val instanceof Set) return { _type: 'Set', value: Array.from(val.values()) }
      return val
    }, 2)
  } catch {
    return ''
  }
}

const loadEditors = (): void => {
  stores.value.forEach(s => {
    const id = s.id
    const snap = s.state
    editors[id] = pretty(snap)
    parseErrors[id] = null
  })
}

const reloadEditor = (id: string): void => {
  const s = stores.value.find(x => x.id === id)
  if (!s) return
  editors[id] = pretty(s.state)
  parseErrors[id] = null
}

const validateEditor = (id: string): void => {
  try {
    JSON.parse(editors[id] || '{}')
    parseErrors[id] = null
  } catch (e: unknown) {
    parseErrors[id] = e instanceof Error ? e.message : 'Invalid JSON'
  }
}

const saveState = async (id: string): Promise<void> => {
  if (parseErrors[id]) return
  savingId.value = id
  try {
    const parsed = JSON.parse(editors[id] || '{}')
    await patchState(id, parsed)
    reloadEditor(id)
  } finally {
    savingId.value = ''
  }
}

const zeroArgActions = (id: string): string[] => {
  const inst = getStore(id)
  if (!inst) return []
  const keys = Object.keys(inst).filter(k => typeof (inst as any)[k] === 'function' && !k.startsWith('$'))
  const list = keys.filter(k => {
    const fn = (inst as any)[k]
    return typeof fn === 'function' && fn.length === 0
  })
  return list.sort()
}

const callAction = (id: string, action: string): void => {
  const inst = getStore(id)
  if (!inst) return
  const fn = (inst as any)[action]
  if (typeof fn === 'function') fn()
}

const resetOrClear = (id: string): void => {
  tryResetOrClear(id)
  reloadEditor(id)
}

const matchedLocalKeys = (id: string): string[] => {
  if (typeof window === 'undefined') return []
  const keys: string[] = []
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i)
    if (!k) continue
    if (k.toLowerCase().includes(id.toLowerCase())) {
      keys.push(k)
    }
  }
  return keys
}

const removeLocalKey = (key: string): void => {
  if (typeof window === 'undefined') return
  localStorage.removeItem(key)
}

const localStorageValuePreview = (key: string): string => {
  if (typeof window === 'undefined') return ''
  const v = localStorage.getItem(key)
  if (!v) return ''
  const trimmed = v.length > 100 ? v.slice(0, 100) + '...' : v
  return trimmed
}

const prettyState = (state: unknown): string => pretty(state)

const refresh = (): void => {
  refreshStores()
  loadEditors()
}

onMounted(() => {
  refresh()
})

watch(editors, () => {
  Object.keys(editors).forEach(validateEditor)
})
</script>