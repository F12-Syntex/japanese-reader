<template>
  <BaseModal v-model="modelValue" title="Reader Settings" subtitle="Customize your reading experience" size="lg">
    <template #default>
      <div class="flex h-full min-h-0">
        <div class="w-40 sm:w-48 border-r border-base-300 flex-shrink-0 overflow-y-auto custom-scrollbar">
          <div class="p-2 sm:p-3 space-y-1">
            <button 
              v-for="tab in tabs" 
              :key="tab.id"
              @click="activeTab = tab.id"
              class="btn btn-ghost btn-xs sm:btn-sm w-full justify-start gap-2 text-left"
              :class="{ 'btn-active': activeTab === tab.id }"
            >
              <component :is="tab.icon" class="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
              <span class="text-xs sm:text-sm truncate">{{ tab.label }}</span>
            </button>
          </div>
        </div>

        <div class="flex-1 overflow-y-auto custom-scrollbar min-h-0">
          <div class="p-4 sm:p-6">
            <div v-show="activeTab === 'typography'" class="space-y-6">
              <div class="space-y-4">
                <div class="flex items-center justify-between mb-3">
                  <h3 class="text-base font-bold">Fonts</h3>
                  <button @click="activeTab = 'marketplace'" class="btn btn-ghost btn-sm gap-2">
                    <IconStore class="w-4 h-4" />
                    Font Marketplace
                  </button>
                </div>

                <div class="form-control">
                  <label class="label">
                    <span class="label-text font-medium text-sm">Font Family</span>
                  </label>
                  <select v-model="settings.fontFamily" class="select select-bordered select-sm w-full">
                    <option v-for="font in availableFonts" :key="font.value" :value="font.value">
                      {{ font.name }}
                    </option>
                  </select>
                </div>
              </div>

              <div class="space-y-4">
                <h3 class="text-base font-bold mb-3">Typography</h3>

                <div class="form-control">
                  <label class="label">
                    <span class="label-text font-medium text-sm">Font Size: {{ settings.fontSize }}px</span>
                  </label>
                  <input v-model.number="settings.fontSize" type="range" min="16" max="48" class="range range-primary range-xs" />
                </div>

                <div class="form-control">
                  <label class="label">
                    <span class="label-text font-medium text-sm">Font Weight: {{ settings.fontWeight }}</span>
                  </label>
                  <input v-model.number="settings.fontWeight" type="range" min="300" max="700" step="100" class="range range-primary range-xs" />
                </div>

                <div class="form-control">
                  <label class="label">
                    <span class="label-text font-medium text-sm">Line Height: {{ settings.lineHeight.toFixed(1) }}</span>
                  </label>
                  <input v-model.number="settings.lineHeight" type="range" min="1.5" max="3.5" step="0.1" class="range range-primary range-xs" />
                </div>

                <div class="form-control">
                  <label class="label">
                    <span class="label-text font-medium text-sm">Letter Spacing: {{ settings.letterSpacing }}px</span>
                  </label>
                  <input v-model.number="settings.letterSpacing" type="range" min="0" max="8" step="1" class="range range-primary range-xs" />
                </div>

                <div class="form-control">
                  <label class="label">
                    <span class="label-text font-medium text-sm">Text Align</span>
                  </label>
                  <select v-model="settings.textAlign" class="select select-bordered select-sm w-full">
                    <option value="left">Left</option>
                    <option value="center">Center</option>
                    <option value="right">Right</option>
                    <option value="justify">Justify</option>
                  </select>
                </div>

                <div class="form-control">
                  <label class="label">
                    <span class="label-text font-medium text-sm">Max Width</span>
                  </label>
                  <select v-model="settings.maxWidth" class="select select-bordered select-sm w-full">
                    <option value="full">Full Width</option>
                    <option value="2xl">Reading Width (42rem)</option>
                    <option value="4xl">Wide (56rem)</option>
                    <option value="6xl">Extra Wide (72rem)</option>
                  </select>
                </div>

                <div class="form-control">
                  <label class="label cursor-pointer">
                    <span class="label-text font-medium text-sm">Word Spacing</span>
                    <input v-model="settings.showWordSpacing" type="checkbox" class="toggle toggle-primary toggle-sm" />
                  </label>
                </div>

                <div class="form-control">
                  <label class="label cursor-pointer">
                    <span class="label-text font-medium text-sm">Vertical Text</span>
                    <input v-model="settings.verticalText" type="checkbox" class="toggle toggle-primary toggle-sm" />
                  </label>
                </div>
              </div>
            </div>

            <div v-show="activeTab === 'marketplace'" class="space-y-4">
              <div class="flex items-center justify-between mb-4">
                <div>
                  <h3 class="text-base font-bold">Font Marketplace</h3>
                  <p class="text-xs text-base-content/60 mt-1">Download and manage Japanese fonts</p>
                </div>
                <button @click="activeTab = 'typography'" class="btn btn-ghost btn-sm gap-2">
                  <IconArrowLeft class="w-4 h-4" />
                  Back
                </button>
              </div>

              <div class="form-control">
                <input
                  v-model="marketplaceSearch"
                  type="text"
                  placeholder="Search fonts..."
                  class="input input-bordered input-sm w-full"
                />
              </div>

              <div class="tabs tabs-boxed">
                <a class="tab tab-sm" :class="{ 'tab-active': marketplaceTab === 'available' }" @click="marketplaceTab = 'available'">
                  Available ({{ filteredDownloadableFonts.length }})
                </a>
                <a class="tab tab-sm" :class="{ 'tab-active': marketplaceTab === 'installed' }" @click="marketplaceTab = 'installed'">
                  Installed ({{ installedFonts.length }})
                </a>
                <a class="tab tab-sm" :class="{ 'tab-active': marketplaceTab === 'custom' }" @click="marketplaceTab = 'custom'">
                  Custom
                </a>
              </div>

              <div v-if="marketplaceTab === 'available'" class="space-y-3">
                <div v-if="downloadableFonts.length === 0" class="flex flex-col items-center justify-center py-12 text-center">
                  <IconCheck class="w-12 h-12 text-success mb-4" />
                  <p class="text-sm text-base-content/60">All available fonts installed!</p>
                </div>

                <div v-else-if="filteredDownloadableFonts.length === 0" class="flex flex-col items-center justify-center py-12 text-center">
                  <IconSearch class="w-12 h-12 text-base-content/20 mb-4" />
                  <p class="text-sm text-base-content/60">No fonts found matching "{{ marketplaceSearch }}"</p>
                </div>

                <div v-else class="grid grid-cols-1 gap-3">
                  <div 
                    v-for="font in filteredDownloadableFonts" 
                    :key="font.value"
                    class="card bg-base-200 border border-base-300 hover:border-primary transition-colors"
                  >
                    <div class="card-body p-4">
                      <div class="flex items-start justify-between gap-3">
                        <div class="flex-1 min-w-0">
                          <h4 class="font-bold text-sm mb-2">{{ font.name }}</h4>
                          <div 
                            class="text-lg mb-3 p-3 bg-base-100 rounded border border-base-300 whitespace-nowrap overflow-hidden text-ellipsis"
                            :style="{ fontFamily: font.value }"
                          >
                            こんにちは世界
                          </div>
                        </div>
                        <button
                          @click="downloadFont(font)"
                          :disabled="isLoadingFont === font.value"
                          class="btn btn-primary btn-sm gap-2 flex-shrink-0"
                        >
                          <span v-if="isLoadingFont === font.value" class="loading loading-spinner loading-xs"></span>
                          <IconDownload v-else class="w-4 h-4" />
                          {{ isLoadingFont === font.value ? 'Loading...' : 'Download' }}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div v-if="marketplaceTab === 'installed'" class="space-y-3">
                <div v-if="installedFonts.length <= 1" class="flex flex-col items-center justify-center py-12 text-center">
                  <IconPackage class="w-12 h-12 text-base-content/20 mb-4" />
                  <p class="text-sm text-base-content/60">No fonts installed yet</p>
                  <button @click="marketplaceTab = 'available'" class="btn btn-primary btn-sm mt-4">
                    Browse Available Fonts
                  </button>
                </div>

                <div v-else class="grid grid-cols-1 gap-3">
                  <div 
                    v-for="font in installedFonts" 
                    :key="font.value"
                    class="card bg-base-200 border border-base-300"
                  >
                    <div class="card-body p-4">
                      <div class="flex items-start justify-between gap-3">
                        <div class="flex-1 min-w-0">
                          <div class="flex items-center gap-2 mb-2">
                            <h4 class="font-bold text-sm">{{ font.name }}</h4>
                            <span v-if="settings.fontFamily === font.value" class="badge badge-primary badge-xs">Active</span>
                          </div>
                          <div 
                            class="text-lg mb-3 p-3 bg-base-100 rounded border border-base-300 whitespace-nowrap overflow-hidden text-ellipsis"
                            :style="{ fontFamily: font.value }"
                          >
                            こんにちは世界
                          </div>
                        </div>
                        <div class="flex flex-col gap-2 flex-shrink-0">
                          <button
                            v-if="font.value !== systemFont"
                            @click="selectFont(font)"
                            class="btn btn-sm gap-2"
                            :class="settings.fontFamily === font.value ? 'btn-success' : 'btn-ghost'"
                          >
                            <IconCheck class="w-4 h-4" />
                            {{ settings.fontFamily === font.value ? 'Active' : 'Use' }}
                          </button>
                          <button
                            v-else
                            @click="selectFont(font)"
                            class="btn btn-sm gap-2"
                            :class="settings.fontFamily === font.value ? 'btn-success' : 'btn-ghost'"
                          >
                            <IconCheck class="w-4 h-4" />
                            {{ settings.fontFamily === font.value ? 'Active' : 'Use' }}
                          </button>
                          <button
                            v-if="font.value !== systemFont"
                            @click="deleteFont(font)"
                            class="btn btn-error btn-outline btn-sm gap-2"
                          >
                            <IconTrash class="w-4 h-4" />
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div v-if="marketplaceTab === 'custom'" class="space-y-4">
                <div class="alert alert-info text-xs">
                  <IconInfo class="w-4 h-4" />
                  <span>
                    To add a custom font, visit <a href="https://fonts.google.com" target="_blank" class="link link-primary">Google Fonts</a>
                  </span>
                </div>

                <div class="form-control">
                  <label class="label">
                    <span class="label-text font-medium text-sm">Custom Font URL</span>
                  </label>
                  <div class="join">
                    <input
                      v-model="customUrl"
                      type="text"
                      placeholder="Paste Google Fonts URL"
                      class="input input-bordered input-sm w-full join-item"
                    />
                    <button
                      @click="addCustomFont"
                      :disabled="!customUrl || isLoadingCustom"
                      class="btn btn-primary btn-sm join-item"
                    >
                      <span v-if="isLoadingCustom" class="loading loading-spinner loading-xs"></span>
                      Add
                    </button>
                  </div>
                </div>

                <div v-if="customError" class="alert alert-error text-xs">
                  {{ customError }}
                </div>
              </div>
            </div>

            <div v-show="activeTab === 'furigana'" class="space-y-4">
              <h3 class="text-base font-bold mb-3">Furigana Settings</h3>

              <div class="form-control">
                <label class="label cursor-pointer">
                  <span class="label-text font-medium text-sm">Show Furigana</span>
                  <input v-model="settings.showFurigana" type="checkbox" class="toggle toggle-secondary toggle-sm" />
                </label>
              </div>

              <div class="form-control">
                <label class="label">
                  <span class="label-text font-medium text-sm">Furigana Size: {{ (settings.furiganaSize * 100).toFixed(0) }}%</span>
                </label>
                <input v-model.number="settings.furiganaSize" type="range" min="0.3" max="0.7" step="0.05" class="range range-secondary range-xs" />
              </div>

              <div class="form-control">
                <label class="label cursor-pointer">
                  <span class="label-text font-medium text-sm">Centered Furigana</span>
                  <input v-model="settings.centeredFurigana" type="checkbox" class="toggle toggle-secondary toggle-sm" />
                </label>
              </div>
            </div>

            <div v-show="activeTab === 'kanji'" class="space-y-4">
              <h3 class="text-base font-bold mb-3">Kanji Settings</h3>

              <div class="form-control">
                <label class="label cursor-pointer">
                  <span class="label-text font-medium text-sm">Show Kanji Info</span>
                  <input v-model="settings.showKanjiInfo" type="checkbox" class="toggle toggle-success toggle-sm" />
                </label>
              </div>

              <div class="form-control">
                <label class="label">
                  <span class="label-text font-medium text-sm">Kanji Info Position</span>
                </label>
                <select v-model="settings.kanjiInfoPosition" class="select select-bordered select-sm w-full">
                  <option value="tooltip">Tooltip</option>
                  <option value="popup">Popup</option>
                  <option value="sidebar">Sidebar</option>
                </select>
              </div>
            </div>

            <div v-show="activeTab === 'colors'" class="space-y-4">
              <h3 class="text-base font-bold mb-3">Color Settings</h3>

              <div class="form-control">
                <label class="label">
                  <span class="label-text font-medium text-sm">Hiragana Color</span>
                </label>
                <input v-model="settings.hiraganaColor" type="color" class="input input-bordered h-10" />
              </div>

              <div class="form-control">
                <label class="label">
                  <span class="label-text font-medium text-sm">Katakana Color</span>
                </label>
                <input v-model="settings.katakanaColor" type="color" class="input input-bordered h-10" />
              </div>

              <div class="form-control">
                <label class="label">
                  <span class="label-text font-medium text-sm">Kanji Color</span>
                </label>
                <input v-model="settings.kanjiColor" type="color" class="input input-bordered h-10" />
              </div>

              <div class="form-control">
                <label class="label">
                  <span class="label-text font-medium text-sm">Unknown Word Color</span>
                </label>
                <input v-model="settings.unknownWordColor" type="color" class="input input-bordered h-10" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import IconStore from '~icons/lucide/shopping-bag'
import IconArrowLeft from '~icons/lucide/arrow-left'
import IconDownload from '~icons/lucide/download'
import IconCheck from '~icons/lucide/check'
import IconTrash from '~icons/lucide/trash-2'
import IconSearch from '~icons/lucide/search'
import IconPackage from '~icons/lucide/package'
import IconInfo from '~icons/lucide/info'

interface Props {
  modelValue: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{ 'update:modelValue': [boolean] }>()

const fontStore = useFontStore()
const readerSettingsStore = useReaderSettingsStore()

const modelValue = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value)
})

const settings = computed(() => readerSettingsStore.settings)
const activeTab = ref('typography')
const marketplaceTab = ref('available')
const marketplaceSearch = ref('')
const customUrl = ref('')
const isLoadingCustom = ref(false)
const customError = ref('')
const systemFont = 'Noto Sans JP'

const downloadableFonts = computed(() => fontStore.downloadableFonts)
const installedFonts = computed(() => fontStore.installedFonts)
const isLoadingFont = computed(() => fontStore.loading)

const filteredDownloadableFonts = computed(() => {
  if (!marketplaceSearch.value) return downloadableFonts.value
  
  const searchLower = marketplaceSearch.value.toLowerCase()
  return downloadableFonts.value.filter(font =>
    font.name.toLowerCase().includes(searchLower)
  )
})

const availableFonts = computed(() => installedFonts.value)

const downloadFont = async (font: any) => {
  await fontStore.installFont(font)
}

const selectFont = (font: any) => {
  settings.value.fontFamily = font.value
}

const deleteFont = (font: any) => {
  if (confirm(`Delete font: ${font.name}?`)) {
    fontStore.removeFont(font.value)
  }
}

const addCustomFont = async () => {
  if (!customUrl.value) return
  
  customError.value = ''
  isLoadingCustom.value = true
  
  try {
    const link = document.createElement('link')
    link.href = customUrl.value
    link.rel = 'stylesheet'
    
    await new Promise((resolve, reject) => {
      link.onload = () => resolve(true)
      link.onerror = () => reject(new Error('Failed to load font'))
      document.head.appendChild(link)
      
      setTimeout(() => resolve(true), 2000)
    })
    
    customUrl.value = ''
  } catch (error) {
    customError.value = `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
  } finally {
    isLoadingCustom.value = false
  }
}

const tabs = [
  { id: 'typography', label: 'Typography', icon: 'div' },
  { id: 'marketplace', label: 'Font Marketplace', icon: 'div' },
  { id: 'furigana', label: 'Furigana', icon: 'div' },
  { id: 'kanji', label: 'Kanji', icon: 'div' },
  { id: 'colors', label: 'Colors', icon: 'div' }
]
</script>