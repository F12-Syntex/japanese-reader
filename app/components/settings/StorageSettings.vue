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
              @click="tab = 'stores'"
            >
              <IconPackage class="w-4 h-4" />
            </button>
            <button
              class="tab tab-sm p-2"
              :class="{ 'tab-active': tab === 'local' }"
              @click="tab = 'local'"
            >
              <IconHardDrive class="w-4 h-4" />
            </button>
            <button
              class="tab tab-sm p-2"
              :class="{ 'tab-active': tab === 'io' }"
              @click="tab = 'io'"
            >
              <IconImport class="w-4 h-4" />
            </button>
          </div>
        </div>

        <div class="divider my-2"></div>

        <!-- -----------------------
             STORES TAB
        ------------------------ -->
        <div v-if="tab === 'stores'" class="flex-1 min-h-0 flex flex-col gap-3">
          <div class="join w-full">
            <input
              v-model="storeQuery"
              type="text"
              placeholder="Search stores"
              class="input input-bordered input-sm w-full join-item"
            />
            <button @click="refreshStores()" class="btn btn-ghost btn-sm join-item">
              <IconRefreshCw class="w-4 h-4" />
            </button>
          </div>

          <div v-if="filteredStores.length === 0" class="flex-1 flex items-center justify-center">
            <div class="text-center text-xs text-base-content/60 space-y-2">
              <IconSearch class="w-8 h-8 mx-auto text-base-content/30" />
              <p>No stores found</p>
            </div>
          </div>

          <div v-else class="flex-1 overflow-y-auto space-y-3">
            <div
              v-for="s in filteredStores"
              :key="s.id"
              class="card bg-base-200/50 border border-base-300"
            >
              <div class="collapse collapse-arrow">
                <input type="checkbox" />
                <div class="collapse-title flex items-center justify-between gap-3">
                  <div class="flex items-center gap-2 min-w-0">
                    <span class="badge badge-primary badge-sm">{{ s.id }}</span>
                    <span class="badge badge-ghost badge-sm"
                      >keys: {{ Object.keys(s.state || {}).length }}</span
                    >
                  </div>
                  <div class="flex gap-1">
                    <button @click.stop="reloadEditor(s.id)" class="btn btn-ghost btn-xs">
                      <IconRotateCcw class="w-4 h-4" />
                    </button>
                    <button @click.stop="resetOrClear(s.id)" class="btn btn-error btn-outline btn-xs">
                      <IconTrash class="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div class="collapse-content">
                  <div class="grid grid-cols-1 lg:grid-cols-2 gap-2 mt-2">
                    <div>
                      <label class="label-text text-xs font-medium">State JSON</label>
                      <textarea
                        v-model="editors[s.id]"
                        class="textarea textarea-bordered font-mono text-xs min-h-[200px]"
                        spellcheck="false"
                        @input="validateEditor(s.id)"
                      ></textarea>

                      <div class="flex gap-1 mt-1">
                        <button
                          @click="saveState(s.id)"
                          class="btn btn-primary btn-sm"
                          :disabled="!!parseErrors[s.id] || savingId === s.id"
                        >
                          <span v-if="savingId === s.id" class="loading loading-spinner loading-xs"></span>
                          <span v-else>Save</span>
                        </button>
                      </div>
                    </div>

                    <div>
                      <label class="label-text text-xs font-medium">State Preview</label>
                      <div
                        v-if="!isTooLargeToDisplay(s.state)"
                        class="p-3 rounded border border-base-300 bg-base-100 overflow-x-auto text-xs"
                      >
                        <pre>{{ prettyState(s.state) }}</pre>
                      </div>
                      <div
                        v-else
                        class="p-3 rounded border border-base-300 bg-base-100 text-error text-xs"
                      >
                        ⚠ Data too large to display (&gt;{{ MAX_VISIBLE_SIZE_MB }} MB)
                      </div>
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

        <!-- -----------------------
             LOCAL TAB (simplified)
        ------------------------ -->
        <div v-else-if="tab === 'local'" class="flex-1 overflow-y-auto">
          <div class="join w-full mb-3">
            <input
              v-model="localQuery"
              type="text"
              placeholder="Search localStorage"
              class="input input-bordered input-sm w-full join-item"
            />
            <button @click="reloadLocal()" class="btn btn-ghost btn-sm join-item">
              <IconRefreshCw class="w-4 h-4" />
            </button>
            <button @click="clearAllLocal()" class="btn btn-error btn-outline btn-sm join-item">
              <IconTrash class="w-4 h-4" />
            </button>
          </div>

          <table class="table table-xs w-full">
            <thead>
              <tr>
                <th>Key</th>
                <th class="text-right">Size</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="k in filteredLocalKeys" :key="k">
                <td class="truncate max-w-[40vw]">
                  {{ k }}
                  <span v-if="getLocalKeySize(k) > MAX_VISIBLE_SIZE_BYTES"
                    class="badge badge-warning badge-xs ml-1">Large</span>
                </td>
                <td class="text-right">{{ byteSize(localGet(k)) }}</td>
                <td class="text-right">
                  <button
                    class="btn btn-ghost btn-xs"
                    :disabled="getLocalKeySize(k) > MAX_VISIBLE_SIZE_BYTES"
                    @click="openLocal(k)"
                  >
                    <IconEye class="w-4 h-4" />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- -----------------------
             IO TAB (export/import)
        ------------------------ -->
        <div v-else-if="tab === 'io'" class="flex-1 overflow-y-auto">
          <div class="card bg-base-100 border border-base-300">
            <div class="card-body p-3">
              <h4 class="font-semibold text-sm">Export</h4>
              <textarea
                class="textarea textarea-bordered font-mono text-xs w-full min-h-[180px]"
                readonly
              >{{ exportJson }}</textarea>
              <div class="flex gap-2 mt-2">
                <button class="btn btn-primary btn-sm" @click="refreshExport()">Refresh</button>
                <button class="btn btn-secondary btn-sm" @click="downloadExport()">Download</button>
              </div>
            </div>
          </div>
        </div>
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
import IconRotateCcw from '~icons/lucide/rotate-ccw'
import IconTrash from '~icons/lucide/trash-2'
import IconEye from '~icons/lucide/eye'
import { ref, computed, reactive, onMounted } from 'vue'
import { usePiniaExplorer } from '~/composables/usePiniaExplorer'

/* -------------------- constants --------------------- */
const MAX_VISIBLE_SIZE_MB = 3
const MAX_VISIBLE_SIZE_BYTES = MAX_VISIBLE_SIZE_MB * 1024 * 1024
const MAX_SIZE_BYTES = 5 * 1024 * 1024 // for localStorage preview block

/* -------------------- helpers --------------------- */
const pretty = (v: unknown): string => {
  try {
    return JSON.stringify(v, null, 2)
  } catch {
    return ''
  }
}
const isTooLargeToDisplay = (obj: unknown): boolean => {
  try {
    const json = JSON.stringify(obj)
    return new Blob([json]).size > MAX_VISIBLE_SIZE_BYTES
  } catch {
    return true
  }
}
const byteSize = (v: string | null): string => {
  const n = v ? new Blob([v]).size : 0
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / (1024 * 1024)).toFixed(2)} MB`
}

/* -------------------- Pinia explorer composables --------------------- */
const {
  stores,
  refreshStores,
  patchState,
  tryResetOrClear,
  listLocal,
  localGet,
  localRemove,
  localClearAll,
  exportBundle,
} = usePiniaExplorer()

/* -------------------- reactive state --------------------- */
const tab = ref<'stores' | 'local' | 'io'>('stores')
const storeQuery = ref('')
const localQuery = ref('')
const editors = reactive<Record<string, string>>({})
const parseErrors = reactive<Record<string, string | null>>({})
const savingId = ref('')
const toast = ref<{ message: string; type: 'success' | 'error' } | null>(null)

/* -------------------- stores tab behavior --------------------- */
const filteredStores = computed(() => {
  const q = storeQuery.value.trim().toLowerCase()
  if (!q) return stores.value
  return stores.value.filter(s => s.id.toLowerCase().includes(q))
})
const prettyState = (state: unknown): string => pretty(state)
const reloadEditor = (id: string): void => {
  const s = stores.value.find(x => x.id === id)
  if (!s) return
  editors[id] = pretty(s.state)
}
const validateEditor = (id: string): void => {
  try {
    JSON.parse(editors[id] || '{}')
    parseErrors[id] = null
  } catch (e: any) {
    parseErrors[id] = e.message
  }
}
const saveState = async (id: string) => {
  if (parseErrors[id]) return
  savingId.value = id
  try {
    const parsed = JSON.parse(editors[id] || '{}')
    await patchState(id, parsed)
    reloadEditor(id)
    showToast('Saved', 'success')
  } catch {
    showToast('Save failed', 'error')
  } finally {
    savingId.value = ''
  }
}
const resetOrClear = (id: string) => {
  tryResetOrClear(id)
  reloadEditor(id)
  showToast('Cleared', 'success')
}
const showToast = (m: string, t: 'success' | 'error') => {
  toast.value = { message: m, type: t }
  setTimeout(() => (toast.value = null), 1500)
}

/* -------------------- local tab behavior --------------------- */
const localKeys = ref<string[]>([])
const reloadLocal = () => (localKeys.value = listLocal())
const filteredLocalKeys = computed(() => {
  const q = localQuery.value.trim().toLowerCase()
  return q ? localKeys.value.filter(k => k.toLowerCase().includes(q)) : localKeys.value
})
const getLocalKeySize = (key: string) => new Blob([localGet(key) ?? '']).size
const openLocal = (key: string) => {
  const v = localGet(key)
  if (!v) return
  alert(`${key}:\n\n${getLocalKeySize(key) > MAX_SIZE_BYTES ? 'Too large to display' : v}`)
}
const clearAllLocal = () => {
  localClearAll()
  reloadLocal()
  showToast('Cleared localStorage', 'success')
}

/* -------------------- io tab --------------------- */
const exportJson = ref('')
const refreshExport = () => {
  try {
    exportJson.value = exportBundle()
  } catch {
    exportJson.value = '{}'
  }
}
const downloadExport = () => {
  const blob = new Blob([exportJson.value], { type: 'application/json;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `storage-${new Date().toISOString().replace(/[:.]/g, '-')}.json`
  a.click()
  URL.revokeObjectURL(url)
}

/* -------------------- lifecycle --------------------- */
onMounted(() => {
  refreshStores()
  reloadLocal()
  refreshExport()
})
</script>

<style scoped>
.table td,
.table th {
  white-space: nowrap;
}
</style>