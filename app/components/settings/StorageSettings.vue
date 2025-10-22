<template>
  <div class="h-full w-full flex flex-col min-h-0 overflow-x-hidden">
    <div class="card bg-base-200/50 border border-base-300 h-full">
      <div class="card-body p-5 sm:p-4 h-full flex flex-col min-h-0">
        <div class="flex items-center justify-between gap-2">
          <div class="flex items-center gap-2">
            <IconDatabase class="w-5 h-5" />
            <span class="font-bold text-sm sm:text-base">Storage</span>
          </div>
          <div class="tabs tabs-boxed">
            <button
              class="tab tab-sm p-2"
              :class="{ 'tab-active': tab === 'stores' }"
              aria-label="Stores"
              @click="tab = 'stores'"
            >
              <div class="tooltip tooltip-bottom" data-tip="Stores">
                <IconPackage class="w-4 h-4" />
              </div>
            </button>
            <button
              class="tab tab-sm p-2"
              :class="{ 'tab-active': tab === 'local' }"
              aria-label="Local Storage"
              @click="tab = 'local'"
            >
              <div class="tooltip tooltip-bottom" data-tip="Local Storage">
                <IconHardDrive class="w-4 h-4" />
              </div>
            </button>
            <button
              class="tab tab-sm p-2"
              :class="{ 'tab-active': tab === 'io' }"
              aria-label="Import/Export"
              @click="tab = 'io'"
            >
              <div class="tooltip tooltip-bottom" data-tip="Import">
                <IconImport class="w-4 h-4" />
              </div>
            </button>
          </div>
        </div>

        <div class="divider my-2"></div>

        <div v-if="tab === 'stores'" class="flex-1 min-h-0 flex flex-col gap-3">
          <div class="flex items-center gap-2">
            <div class="join w-full">
              <input v-model="storeQuery" type="text" placeholder="Search stores" class="input input-bordered input-sm w-full join-item" />
              <button @click="refreshStores()" class="btn btn-ghost btn-sm join-item" aria-label="Refresh">
                <IconRefreshCw class="w-4 h-4" />
              </button>
            </div>
          </div>

          <div v-if="filteredStores.length === 0" class="flex-1 min-h-0 flex items-center justify-center">
            <div class="text-center space-y-2">
              <IconSearch class="w-10 h-10 mx-auto text-base-content/30" />
              <p class="text-xs text-base-content/60">No stores found</p>
            </div>
          </div>

          <div v-else class="flex-1 min-h-0 overflow-y-auto space-y-3">
            <div
              v-for="s in filteredStores"
              :key="s.id"
              class="card bg-base-200/50 border border-base-300"
            >
              <div class="collapse collapse-arrow peer">
                <input type="checkbox" class="peer" />
                <div class="collapse-title flex items-start justify-between gap-3 peer-checked:bg-base-300/50">
                  <div class="min-w-0 flex-1">
                    <div class="flex flex-wrap items-center gap-2">
                      <span class="badge badge-primary badge-sm">{{ s.id }}</span>
                      <span class="badge badge-ghost badge-sm">keys: {{ Object.keys(s.state || {}).length }}</span>
                    </div>
                  </div>
                  <div class="flex items-center gap-1 flex-shrink-0">
                    <button @click.stop="reloadEditor(s.id)" class="btn btn-ghost btn-xs" aria-label="Reload">
                      <div class="tooltip tooltip-bottom" data-tip="Reload">
                        <IconRotateCcw class="w-4 h-4" />
                      </div>
                    </button>
                    <button @click.stop="resetOrClear(s.id)" class="btn btn-error btn-outline btn-xs" aria-label="Clear">
                      <div class="tooltip tooltip-bottom" data-tip="Clear">
                        <IconTrash class="w-4 h-4" />
                      </div>
                    </button>
                  </div>
                </div>
                <div class="collapse-content">
                  <div class="mt-3 grid grid-cols-1 lg:grid-cols-2 gap-3">
                    <div class="space-y-2">
                      <div class="form-control">
                        <label class="label">
                          <span class="label-text text-xs sm:text-sm font-medium">State JSON</span>
                          <span v-if="parseErrors[s.id]" class="badge badge-error badge-xs">{{ parseErrors[s.id] }}</span>
                        </label>
                        <textarea
                          v-model="editors[s.id]"
                          class="textarea textarea-bordered font-mono text-xs min-h-[200px] sm:min-h-[220px]"
                          spellcheck="false"
                          @input="validateEditor(s.id)"
                        ></textarea>
                      </div>

                      <div class="flex flex-wrap gap-1">
                        <button
                          @click="saveState(s.id)"
                          class="btn btn-primary btn-sm"
                          :disabled="!!parseErrors[s.id] || savingId === s.id"
                          aria-label="Save"
                        >
                          <span v-if="savingId === s.id" class="loading loading-spinner loading-xs"></span>
                          <div v-else class="tooltip tooltip-bottom" data-tip="Save">
                            <IconSave class="w-4 h-4" />
                          </div>
                        </button>

                        <div class="dropdown dropdown-end">
                          <label tabindex="0" class="btn btn-ghost btn-sm" aria-label="Actions">
                            <div class="tooltip tooltip-bottom" data-tip="Actions">
                              <IconPlay class="w-4 h-4" />
                            </div>
                          </label>
                          <ul tabindex="0" class="dropdown-content z-[1] p-2 shadow bg-base-100 rounded-box border border-base-300 w-48 max-h-64 overflow-auto">
                            <li v-for="a in zeroArgActions(s.id)" :key="s.id + '-' + a">
                              <button class="btn btn-ghost btn-xs justify-start" @click="callAction(s.id, a)">{{ a }}</button>
                            </li>
                            <li v-if="zeroArgActions(s.id).length === 0" class="px-3 py-1 text-xs text-base-content/60">No zero-arg actions</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div class="space-y-2">
                      <div class="form-control">
                        <label class="label">
                          <span class="label-text text-xs sm:text-sm font-medium">State Preview</span>
                        </label>
                        <pre class="p-3 rounded border border-base-300 bg-base-100 overflow-x-auto text-xs">{{ prettyState(s.state) }}</pre>
                      </div>

                      <div class="form-control">
                        <label class="label">
                          <span class="label-text text-xs sm:text-sm font-medium">Matching Local Storage</span>
                        </label>
                        <div class="space-y-2">
                          <div v-if="matchedLocalKeys(s.id).length === 0" class="text-xs text-base-content/60">No matching keys</div>
                          <div v-else class="space-y-2">
                            <div v-for="k in matchedLocalKeys(s.id)" :key="k" class="flex items-center justify-between gap-2 rounded border border-base-300 bg-base-100 p-2">
                              <div class="min-w-0 flex-1">
                                <div class="text-xs truncate">{{ k }}</div>
                                <div class="text-[10px] text-base-content/60">{{ byteSize(localGet(k)) }}</div>
                              </div>
                              <div class="join">
                                <button class="btn btn-ghost btn-xs join-item" @click="openLocal(k)" aria-label="View">
                                  <div class="tooltip tooltip-left" data-tip="View">
                                    <IconEye class="w-4 h-4" />
                                  </div>
                                </button>
                                <button class="btn btn-error btn-outline btn-xs join-item" @click="removeLocal(k)" aria-label="Delete">
                                  <div class="tooltip tooltip-left" data-tip="Delete">
                                    <IconTrash class="w-4 h-4" />
                                  </div>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div v-if="localEditorKey === s.id" class="hidden"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div v-if="toast" class="toast toast-end">
            <div :class="toast.type === 'success' ? 'alert alert-success' : 'alert alert-error'">
              <span>{{ toast.message }}</span>
            </div>
          </div>
        </div>

        <div v-if="tab === 'local'" class="flex-1 min-h-0 flex flex-col gap-3">
          <div class="flex items-center gap-2">
            <div class="join w-full">
              <input v-model="localQuery" type="text" placeholder="Search localStorage" class="input input-bordered input-sm w-full join-item" />
              <button @click="reloadLocal()" class="btn btn-ghost btn-sm join-item" aria-label="Refresh">
                <IconRefreshCw class="w-4 h-4" />
              </button>
            </div>
            <button @click="clearAllLocal()" class="btn btn-error btn-outline btn-sm" aria-label="Clear All">
              <IconTrash class="w-4 h-4" />
            </button>
          </div>

          <div class="md:hidden flex-1 min-h-0 overflow-y-auto space-y-2">
            <div v-for="k in filteredLocalKeys" :key="k" class="card bg-base-100 border border-base-300">
              <div class="card-body p-3">
                <div class="flex items-center justify-between gap-2">
                  <div class="min-w-0 flex-1">
                    <div class="text-xs truncate">{{ k }}</div>
                    <div class="text-[10px] text-base-content/60">{{ byteSize(localGet(k)) }}</div>
                  </div>
                  <div class="join">
                    <button class="btn btn-ghost btn-xs join-item" @click="openLocal(k)" aria-label="View">
                      <IconEye class="w-4 h-4" />
                    </button>
                    <button class="btn btn-primary btn-xs join-item" @click="editLocal(k)" aria-label="Edit">
                      <IconPencil class="w-4 h-4" />
                    </button>
                    <button class="btn btn-error btn-outline btn-xs join-item" @click="removeLocal(k)" aria-label="Delete">
                      <IconTrash class="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div v-if="filteredLocalKeys.length === 0" class="text-center text-xs text-base-content/60 py-6">No keys</div>
          </div>

          <div class="hidden md:block flex-1 min-h-0 overflow-y-auto">
            <div class="overflow-x-auto">
              <table class="table table-xs w-full">
                <thead>
                  <tr>
                    <th>Key</th>
                    <th class="text-right">Size</th>
                    <th class="w-32 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="k in filteredLocalKeys" :key="k">
                    <td class="max-w-[40vw] truncate">{{ k }}</td>
                    <td class="text-right">{{ byteSize(localGet(k)) }}</td>
                    <td class="text-right">
                      <div class="join justify-end">
                        <button class="btn btn-ghost btn-xs join-item" @click="openLocal(k)" aria-label="View">
                          <IconEye class="w-4 h-4" />
                        </button>
                        <button class="btn btn-primary btn-xs join-item" @click="editLocal(k)" aria-label="Edit">
                          <IconPencil class="w-4 h-4" />
                        </button>
                        <button class="btn btn-error btn-outline btn-xs join-item" @click="removeLocal(k)" aria-label="Delete">
                          <IconTrash class="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                  <tr v-if="filteredLocalKeys.length === 0">
                    <td colspan="3" class="text-center text-xs text-base-content/60 py-6">No keys</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div v-if="tab === 'io'" class="flex-1 min-h-0 grid grid-rows-1 gap-3">
          <div class="card bg-base-100 border border-base-300 h-full">
            <div class="card-body p-3 sm:p-4 h-full flex flex-col gap-2">
              <div class="flex items-center justify-between">
                <h4 class="font-semibold text-sm">Export</h4>
                <div class="join">
                  <button class="btn btn-primary btn-sm join-item" @click="refreshExport()" aria-label="Refresh">
                    <IconRefreshCw class="w-4 h-4" />
                  </button>
                  <button class="btn btn-ghost btn-sm join-item" @click="copy(exportJson)" aria-label="Copy">
                    <IconClipboard class="w-4 h-4" />
                  </button>
                  <button class="btn btn-secondary btn-sm join-item" @click="downloadExport()" aria-label="Download">
                    <IconDownload class="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div class="flex-1 min-h-0">
                <textarea class="textarea textarea-bordered font-mono text-xs w-full h-full min-h-[200px]" readonly :value="exportJson"></textarea>
              </div>
            </div>
          </div>

          <div class="card bg-base-100 border border-base-300 h-full">
            <div class="card-body p-3 sm:p-4 h-full flex flex-col gap-2">
              <div class="flex items-center justify-between">
                <h4 class="font-semibold text-sm">Import</h4>
                <div class="join">
                  <button class="btn btn-primary btn-sm join-item" @click="triggerFile()" aria-label="Pick File">
                    <IconUpload class="w-4 h-4" />
                  </button>
                  <button class="btn btn-ghost btn-sm join-item" @click="clearImport()" aria-label="Reset">
                    <IconRotateCcw class="w-4 h-4" />
                  </button>
                </div>
              </div>
              <input ref="fileInput" type="file" accept="application/json,.json" class="hidden" @change="pickImportFile" />
              <div class="flex-1 min-h-0">
                <textarea v-model="importJson" class="textarea textarea-bordered font-mono text-xs w-full h-full min-h-[200px]" placeholder='Paste JSON bundle here'></textarea>
              </div>
              <div class="flex items-center justify-end gap-2">
                <button class="btn btn-primary btn-sm" @click="applyImport()" :disabled="!importJson.trim()" aria-label="Import">
                  <IconUpload class="w-4 h-4" />
                </button>
                <button class="btn btn-ghost btn-sm" @click="clearImport()" aria-label="Reset">
                  <IconRotateCcw class="w-4 h-4" />
                </button>
              </div>
              <div v-if="importError" class="alert alert-error text-xs">
                {{ importError }}
              </div>
            </div>
          </div>
        </div>

        <dialog ref="localModal" class="modal">
          <div class="modal-box max-w-2xl">
            <h3 class="font-bold text-sm mb-3 flex items-center gap-2">
              <IconHardDrive class="w-4 h-4" />
              {{ activeLocalKey }}
            </h3>
            <textarea v-model="localEditor" class="textarea textarea-bordered font-mono text-xs w-full min-h-[260px]"></textarea>
            <div class="modal-action">
              <button class="btn btn-ghost btn-sm" @click="closeLocal()" aria-label="Close">
                <IconX class="w-4 h-4" />
              </button>
              <button class="btn btn-primary btn-sm" @click="saveLocal()" aria-label="Save">
                <IconSave class="w-4 h-4" />
              </button>
            </div>
          </div>
          <form method="dialog" class="modal-backdrop">
            <button></button>
          </form>
        </dialog>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import IconDatabase from '~icons/lucide/database'
import IconPackage from '~icons/lucide/package'
import IconHardDrive from '~icons/lucide/hard-drive'
import IconImport from '~icons/lucide/import'
import IconRefreshCw from '~icons/lucide/refresh-cw'
import IconSearch from '~icons/lucide/search'
import IconSave from '~icons/lucide/save'
import IconRotateCcw from '~icons/lucide/rotate-ccw'
import IconTrash from '~icons/lucide/trash-2'
import IconPlay from '~icons/lucide/play'
import IconEye from '~icons/lucide/eye'
import IconPencil from '~icons/lucide/pencil'
import IconClipboard from '~icons/lucide/clipboard'
import IconDownload from '~icons/lucide/download'
import IconUpload from '~icons/lucide/upload'
import IconX from '~icons/lucide/x'
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { usePiniaExplorer } from '~/composables/usePiniaExplorer'

type ToastType = 'success' | 'error'

interface StoreItem {
  id: string
  state?: Record<string, unknown>
}

const tab = ref<'stores' | 'local' | 'io'>('stores')
const storeQuery = ref<string>('')
const localQuery = ref<string>('')

const {
  stores,
  refreshStores,
  patchState,
  tryResetOrClear,
  getStore,
  listLocal,
  localGet,
  localSet,
  localRemove,
  localClearAll,
  exportBundle,
  importBundle
} = usePiniaExplorer()

const editors = reactive<Record<string, string>>({})
const parseErrors = reactive<Record<string, string | null>>({})
const savingId = ref<string>('')

const filteredStores = computed(() => {
  const q = storeQuery.value.trim().toLowerCase()
  const arr = stores.value
  if (!q) return arr
  return arr.filter(s => s.id.toLowerCase().includes(q))
})

const pretty = (v: unknown): string => {
  try {
    return JSON.stringify(
      v,
      (_k, val) => {
        if (val instanceof Map) return { _type: 'Map', value: Array.from(val.entries()) }
        if (val instanceof Set) return { _type: 'Set', value: Array.from(val.values()) }
        return val
      },
      2
    )
  } catch {
    return ''
  }
}

const loadEditors = (): void => {
  stores.value.forEach(s => {
    const id = s.id
    editors[id] = pretty(s.state)
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
    const parsed = JSON.parse(editors[id] || '{}') as Record<string, unknown>
    await patchState(id, parsed)
    reloadEditor(id)
    showToast('Saved', 'success')
  } catch {
    showToast('Save failed', 'error')
  } finally {
    savingId.value = ''
  }
}

const zeroArgActions = (id: string): string[] => {
  const inst = getStore(id) as Record<string, unknown> | null
  if (!inst) return []
  const keys = Object.keys(inst).filter(k => typeof (inst as Record<string, unknown>)[k] === 'function' && !k.startsWith('$'))
  const list = keys.filter(k => {
    const fn = (inst as Record<string, unknown>)[k] as unknown
    return typeof fn === 'function' && (fn as (...a: unknown[]) => unknown).length === 0
  })
  return list.sort()
}

const callAction = (id: string, action: string): void => {
  const inst = getStore(id) as Record<string, unknown> | null
  if (!inst) return
  const fn = (inst as Record<string, unknown>)[action]
  if (typeof fn === 'function') {
    try {
      ;(fn as () => unknown)()
      reloadEditor(id)
      showToast(`Action: ${action}`, 'success')
    } catch {
      showToast(`Action failed: ${action}`, 'error')
    }
  }
}

const resetOrClear = (id: string): void => {
  tryResetOrClear(id)
  reloadEditor(id)
  showToast('Cleared', 'success')
}

const matchedLocalKeys = (id: string): string[] => {
  const all = listLocal()
  return all.filter(k => k.toLowerCase().includes(id.toLowerCase()))
}

const toast = ref<{ type: ToastType; message: string } | null>(null)
let toastTimer: number | undefined
const showToast = (message: string, type: ToastType): void => {
  toast.value = { message, type }
  if (toastTimer) window.clearTimeout(toastTimer)
  toastTimer = window.setTimeout(() => (toast.value = null), 1800)
}

const localKeys = ref<string[]>([])
const reloadLocal = (): void => {
  localKeys.value = listLocal()
}
const filteredLocalKeys = computed(() => {
  const q = localQuery.value.trim().toLowerCase()
  if (!q) return localKeys.value
  return localKeys.value.filter(k => k.toLowerCase().includes(q))
})

const localModal = ref<HTMLDialogElement | null>(null)
const activeLocalKey = ref<string>('')
const localEditor = ref<string>('')

const openLocal = (key: string): void => {
  activeLocalKey.value = key
  localEditor.value = localGet(key) ?? ''
  localModal.value?.showModal()
}
const editLocal = (key: string): void => openLocal(key)
const closeLocal = (): void => {
  localModal.value?.close()
  activeLocalKey.value = ''
  localEditor.value = ''
}
const saveLocal = (): void => {
  if (!activeLocalKey.value) return
  localSet(activeLocalKey.value, localEditor.value)
  reloadLocal()
  closeLocal()
  showToast('Local key saved', 'success')
}
const removeLocal = (key: string): void => {
  localRemove(key)
  reloadLocal()
  showToast('Local key removed', 'success')
}
const clearAllLocal = (): void => {
  localClearAll()
  reloadLocal()
  showToast('LocalStorage cleared', 'success')
}
const byteSize = (v: string | null): string => {
  const n = v ? new Blob([v]).size : 0
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / (1024 * 1024)).toFixed(2)} MB`
}

const exportJson = ref<string>('')
const refreshExport = (): void => {
  exportJson.value = exportBundle()
}
const copy = async (text: string): Promise<void> => {
  try {
    await navigator.clipboard.writeText(text)
    showToast('Copied', 'success')
  } catch {
    showToast('Copy failed', 'error')
  }
}
const downloadExport = (): void => {
  const blob = new Blob([exportJson.value], { type: 'application/json;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `storage-${new Date().toISOString().replace(/[:.]/g, '-')}.json`
  document.body.appendChild(a)
  a.click()
  URL.revokeObjectURL(url)
  a.remove()
}

const fileInput = ref<HTMLInputElement | null>(null)
const triggerFile = (): void => {
  fileInput.value?.click()
}
const importJson = ref<string>('')
const importError = ref<string>('')

const pickImportFile = async (e: Event): Promise<void> => {
  const input = e.target as HTMLInputElement | null
  if (!input || !input.files || input.files.length === 0) return
  const file = input.files[0]
  if (!file) return
  const text = await file.text()
  importJson.value = text
}

const clearImport = (): void => {
  importJson.value = ''
  importError.value = ''
  if (fileInput.value) fileInput.value.value = ''
}

const applyImport = (): void => {
  try {
    importBundle(importJson.value)
    refreshStores()
    loadEditors()
    reloadLocal()
    refreshExport()
    importError.value = ''
    showToast('Imported', 'success')
  } catch (e: unknown) {
    importError.value = e instanceof Error ? e.message : 'Import failed'
    showToast('Import failed', 'error')
  }
}

const localEditorKey = ref<string>('')

const prettyState = (state: unknown): string => pretty(state)

onMounted(() => {
  refreshStores()
  loadEditors()
  reloadLocal()
  refreshExport()
})

watch(editors, () => {
  Object.keys(editors).forEach(validateEditor)
})
</script>