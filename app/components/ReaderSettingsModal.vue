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
                  <span class="loading loading-spinner loading-lg text-primary mb-4"></span>
                  <p class="text-sm text-base-content/60">Loading fonts from Google Fonts...</p>
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
                            こんにちは、世界！ 日本語のフォントテストです。
                          </div>
                        </div>
                        <button
                          @click="loadFont(font)"
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
                <div v-if="installedFonts.length === 0" class="flex flex-col items-center justify-center py-12 text-center">
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
                            こんにちは、世界！ 日本語のフォントテストです。
                          </div>
                        </div>
                        <div class="flex flex-col gap-2 flex-shrink-0">
                          <button
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
                    To add a custom font:<br>
                    1. Go to <a href="https://fonts.google.com" target="_blank" class="link link-primary">fonts.google.com</a>.<br>
                    2. Search for a Japanese font.<br>
                    3. Select the font and styles (e.g., weights 300-700).<br>
                    4. In the right panel, copy the &lt;link&gt; href URL (e.g., https://fonts.googleapis.com/css2?family=Hachi+Maru+Pop&display=swap).<br>
                    5. Paste it below and click Add.
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
                      placeholder="Paste Google Fonts URL here"
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
                <label class="label">
                  <span class="label-text font-medium text-sm">Furigana Color</span>
                </label>
                <input v-model="settings.furiganaColor" type="color" class="input input-bordered input-sm w-full h-10" />
                <label class="label">
                  <span class="label-text-alt text-xs">Leave empty for default color</span>
                </label>
              </div>

              <div class="form-control">
                <label class="label cursor-pointer">
                  <span class="label-text font-medium text-sm">Show Pitch Accent</span>
                  <input v-model="settings.showPitchAccent" type="checkbox" class="toggle toggle-accent toggle-sm" />
                </label>
              </div>
            </div>

            <div v-show="activeTab === 'translation'" class="space-y-4">
              <h3 class="text-base font-bold mb-3">Translation Settings</h3>

              <div class="form-control">
                <label class="label cursor-pointer">
                  <span class="label-text font-medium text-sm">Always Show Translation</span>
                  <input v-model="settings.alwaysShowTranslation" type="checkbox" class="toggle toggle-info toggle-sm" />
                </label>
                <label class="label">
                  <span class="label-text-alt text-xs">Display English above each word</span>
                </label>
              </div>

              <div class="form-control">
                <label class="label">
                  <span class="label-text font-medium text-sm">Translation Size: {{ settings.translationSize }}px</span>
                </label>
                <input v-model.number="settings.translationSize" type="range" min="8" max="16" step="1" class="range range-info range-xs" />
              </div>

              <div class="form-control">
                <label class="label">
                  <span class="label-text font-medium text-sm">Translation Gap: {{ settings.translationGap }}px</span>
                </label>
                <input v-model.number="settings.translationGap" type="range" min="0" max="12" step="1" class="range range-info range-xs" />
              </div>

              <div class="form-control">
                <label class="label cursor-pointer">
                  <span class="label-text font-medium text-sm">Show Tooltips</span>
                  <input v-model="settings.showTooltip" type="checkbox" class="toggle toggle-info toggle-sm" />
                </label>
              </div>

              <div class="form-control">
                <label class="label">
                  <span class="label-text font-medium text-sm">Tooltip Size</span>
                </label>
                <select v-model="settings.tooltipSize" class="select select-bordered select-sm w-full">
                  <option value="sm">Small</option>
                  <option value="md">Medium</option>
                  <option value="lg">Large</option>
                </select>
              </div>

              <div class="form-control">
                <label class="label cursor-pointer">
                  <span class="label-text font-medium text-sm">Show Part of Speech</span>
                  <input v-model="settings.showPartOfSpeech" type="checkbox" class="toggle toggle-info toggle-sm" />
                </label>
              </div>
            </div>

            <div v-show="activeTab === 'highlighting'" class="space-y-4">
              <h3 class="text-base font-bold mb-3">Color Highlighting</h3>

              <div class="alert alert-info text-xs py-2">
                <IconInfo class="w-3 h-3" />
                <span>Words will be colored based on their grammatical function</span>
              </div>

              <div class="form-control">
                <label class="label cursor-pointer">
                  <span class="label-text font-medium text-sm">Highlight Particles</span>
                  <input v-model="settings.highlightParticles" type="checkbox" class="toggle toggle-warning toggle-sm" />
                </label>
                <label class="label">
                  <span class="label-text-alt text-xs flex items-center gap-2">
                    <span class="badge badge-warning badge-xs"></span>
                   Particles, etc. (Warning color)
                  </span>
                </label>
              </div>

              <div class="form-control">
                <label class="label cursor-pointer">
                  <span class="label-text font-medium text-sm">Highlight Verbs</span>
                  <input v-model="settings.highlightVerbs" type="checkbox" class="toggle toggle-success toggle-sm" />
                </label>
                <label class="label">
                  <span class="label-text-alt text-xs flex items-center gap-2">
                    <span class="badge badge-success badge-xs"></span>
                    Action words (Success color)
                  </span>
                </label>
              </div>

              <div class="form-control">
                <label class="label cursor-pointer">
                  <span class="label-text font-medium text-sm">Highlight Adjectives</span>
                  <input v-model="settings.highlightAdjectives" type="checkbox" class="toggle toggle-secondary toggle-sm" />
                </label>
                <label class="label">
                  <span class="label-text-alt text-xs flex items-center gap-2">
                    <span class="badge badge-secondary badge-xs"></span>
                    Describing words (Secondary color)
                  </span>
                </label>
              </div>

              <div class="divider text-xs">Known Words (from Anki)</div>

              <div class="form-control">
                <label class="label cursor-pointer">
                  <span class="label-text font-medium text-sm">Highlight Known Words</span>
                  <input v-model="settings.highlightKnownWords" type="checkbox" class="toggle toggle-success toggle-sm" />
                </label>
                <label class="label">
                  <span class="label-text-alt text-xs">Green background for words you know</span>
                </label>
              </div>

              <div class="form-control">
                <label class="label cursor-pointer">
                  <span class="label-text font-medium text-sm">Dim Known Words</span>
                  <input v-model="settings.dimKnownWords" type="checkbox" class="toggle toggle-accent toggle-sm" />
                </label>
                <label class="label">
                  <span class="label-text-alt text-xs">Lower opacity for known words</span>
                </label>
              </div>

              <div class="form-control">
                <label class="label cursor-pointer">
                  <span class="label-text font-medium text-sm">Strikethrough Known Words</span>
                  <input v-model="settings.strikethroughKnown" type="checkbox" class="toggle toggle-accent toggle-sm" />
                </label>
                <label class="label">
                  <span class="label-text-alt text-xs">Cross out words you already know</span>
                </label>
              </div>

              <div class="form-control">
                <label class="label cursor-pointer">
                  <span class="label-text font-medium text-sm">Underline Unknown Words</span>
                  <input v-model="settings.underlineUnknown" type="checkbox" class="toggle toggle-error toggle-sm" />
                </label>
              </div>
            </div>

            <div v-show="activeTab === 'colors'" class="space-y-4">
              <h3 class="text-base font-bold mb-3">Color Settings</h3>

              <div class="form-control">
                <label class="label">
                  <span class="label-text font-medium text-sm">Text Color</span>
                </label>
                <input v-model="settings.textColor" type="color" class="input input-bordered input-sm w-full h-10" />
                <label class="label">
                  <span class="label-text-alt text-xs">Leave empty for theme default</span>
                </label>
              </div>

              <div class="form-control">
                <label class="label">
                  <span class="label-text font-medium text-sm">Background Color</span>
                </label>
                <input v-model="settings.backgroundColor" type="color" class="input input-bordered input-sm w-full h-10" />
                <label class="label">
                  <span class="label-text-alt text-xs">Leave empty for theme default</span>
                </label>
              </div>
            </div>

            <div v-show="activeTab === 'behavior'" class="space-y-4">
              <h3 class="text-base font-bold mb-3">Behavior Settings</h3>

              <div class="form-control">
                <label class="label cursor-pointer">
                  <span class="label-text font-medium text-sm">Click to Toggle Details</span>
                  <input v-model="settings.clickToToggle" type="checkbox" class="toggle toggle-primary toggle-sm" />
                </label>
              </div>

              <div class="form-control">
                <label class="label cursor-pointer">
                  <span class="label-text font-medium text-sm">Show Sentence Numbers</span>
                  <input v-model="settings.showSentenceNumbers" type="checkbox" class="toggle toggle-primary toggle-sm" />
                </label>
              </div>

              <div class="form-control">
                <label class="label cursor-pointer">
                  <span class="label-text font-medium text-sm">Auto Scroll</span>
                  <input v-model="settings.autoScroll" type="checkbox" class="toggle toggle-primary toggle-sm" />
                </label>
              </div>

              <div class="form-control">
                <label class="label">
                  <span class="label-text font-medium text-sm">Focus Mode Opacity: {{ settings.focusModeOpacity }}%</span>
                </label>
                <input v-model.number="settings.focusModeOpacity" type="range" min="10" max="80" step="5" class="range range-primary range-xs" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <template #footer>
      <button @click="handleReset" class="btn btn-outline btn-sm">
        <IconRotateCcw class="w-4 h-4" />
        Reset
      </button>
      <button @click="modelValue = false" class="btn btn-primary btn-sm">
        <IconCheck class="w-4 h-4" />
        Close
      </button>
    </template>
  </BaseModal>
</template>

<script setup>
import IconCheck from '~icons/lucide/check'
import IconRotateCcw from '~icons/lucide/rotate-ccw'
import IconType from '~icons/lucide/type'
import IconLanguages from '~icons/lucide/languages'
import IconHighlighter from '~icons/lucide/highlighter'
import IconPalette from '~icons/lucide/palette'
import IconSettings from '~icons/lucide/settings'
import IconFileText from '~icons/lucide/file-text'
import IconInfo from '~icons/lucide/info'
import IconDownload from '~icons/lucide/download'
import IconStore from '~icons/lucide/store'
import IconArrowLeft from '~icons/lucide/arrow-left'
import IconTrash from '~icons/lucide/trash-2'
import IconSearch from '~icons/lucide/search'
import IconPackage from '~icons/lucide/package'
import { useReaderSettings } from '~/composables/useReaderSettings'

const modelValue = defineModel()
const { settings, resetSettings } = useReaderSettings()

const activeTab = ref('typography')
const marketplaceTab = ref('available')
const marketplaceSearch = ref('')
const customUrl = ref('')
const customError = ref('')
const isLoadingCustom = ref(false)

const tabs = [
  { id: 'typography', label: 'Typography', icon: IconType },
  { id: 'furigana', label: 'Furigana', icon: IconFileText },
  { id: 'translation', label: 'Translation', icon: IconLanguages },
  { id: 'highlighting', label: 'Highlighting', icon: IconHighlighter },
  { id: 'colors', label: 'Colors', icon: IconPalette },
  { id: 'behavior', label: 'Behavior', icon: IconSettings }
]

const systemFont = 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'

const availableFonts = ref([
  { name: 'System Default', value: systemFont }
])

const downloadableFonts = ref([])

const loadedFonts = ref([])

const fallbackFonts = [
  { name: 'Noto Sans JP', value: 'Noto Sans JP', url: 'https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@300;400;500;700&display=swap' },
  { name: 'Noto Serif JP', value: 'Noto Serif JP', url: 'https://fonts.googleapis.com/css2?family=Noto+Serif+JP:wght@300;400;500;700&display=swap' },
  { name: 'M PLUS Rounded 1c', value: 'M PLUS Rounded 1c', url: 'https://fonts.googleapis.com/css2?family=M+PLUS+Rounded+1c:wght@300;400;500;700;800&display=swap' },
  { name: 'Zen Kaku Gothic New', value: 'Zen Kaku Gothic New', url: 'https://fonts.googleapis.com/css2?family=Zen+Kaku+Gothic+New:wght@300;400;500;700;900&display=swap' },
  { name: 'Zen Maru Gothic', value: 'Zen Maru Gothic', url: 'https://fonts.googleapis.com/css2?family=Zen+Maru+Gothic:wght@300;400;500;700;900&display=swap' },
  { name: 'Sawarabi Gothic', value: 'Sawarabi Gothic', url: 'https://fonts.googleapis.com/css2?family=Sawarabi+Gothic&display=swap' },
  { name: 'Sawarabi Mincho', value: 'Sawarabi Mincho', url: 'https://fonts.googleapis.com/css2?family=Sawarabi+Mincho&display=swap' },
  { name: 'Kosugi Maru', value: 'Kosugi Maru', url: 'https://fonts.googleapis.com/css2?family=Kosugi+Maru&display=swap' },
  { name: 'Kosugi', value: 'Kosugi', url: 'https://fonts.googleapis.com/css2?family=Kosugi&display=swap' },
  { name: 'Yuji Syuku', value: 'Yuji Syuku', url: 'https://fonts.googleapis.com/css2?family=Yuji+Syuku&display=swap' }
]

const installedFonts = computed(() => {
  return availableFonts.value.filter(font => font.value !== systemFont)
})

const filteredDownloadableFonts = computed(() => {
  const search = marketplaceSearch.value.toLowerCase()
  return downloadableFonts.value.filter(font => 
    !availableFonts.value.some(f => f.value === font.value) &&
    (font.name.toLowerCase().includes(search) || !search)
  )
})

const isLoadingFont = ref('')

const selectFont = (font) => {
  settings.value.fontFamily = font.value
}

const deleteFont = (font) => {
  const index = availableFonts.value.findIndex(f => f.value === font.value)
  if (index > -1) {
    availableFonts.value.splice(index, 1)
  }

  const loadedIndex = loadedFonts.value.indexOf(font.value)
  if (loadedIndex > -1) {
    loadedFonts.value.splice(loadedIndex, 1)
    localStorage.setItem('loadedFonts', JSON.stringify(loadedFonts.value))
  }

  const linkElement = document.querySelector(`link[href*="${font.value.replace(/ /g, '+')}"]`)
  if (linkElement) {
    linkElement.remove()
  }

  if (settings.value.fontFamily === font.value) {
    const defaultFont = availableFonts.value[0]
    if (defaultFont) {
      settings.value.fontFamily = defaultFont.value
    }
  }
}

const loadFont = async (font) => {
  if (availableFonts.value.some(f => f.value === font.value)) {
    return
  }

  isLoadingFont.value = font.value

  try {
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = font.url

    link.onload = () => {
      availableFonts.value.push({ name: font.name, value: font.value })
      loadedFonts.value.push(font.value)
      localStorage.setItem('loadedFonts', JSON.stringify(loadedFonts.value))
      isLoadingFont.value = ''
    }

    link.onerror = () => {
      isLoadingFont.value = ''
      alert('Failed to load font: ' + font.name)
    }

    document.head.appendChild(link)
  } catch (error) {
    console.error('Font loading error:', error)
    isLoadingFont.value = ''
  }
}

const addCustomFont = async () => {
  customError.value = ''
  isLoadingCustom.value = true

  const url = customUrl.value.trim()
  if (!url.startsWith('https://fonts.googleapis.com/css2?')) {
    customError.value = 'Invalid URL. Must be a Google Fonts CSS link.'
    isLoadingCustom.value = false
    return
  }

  const match = url.match(/family=([^&]+)/)
  if (!match) {
    customError.value = 'Could not extract font family from URL.'
    isLoadingCustom.value = false
    return
  }

  const familyEncoded = match[1]
  const family = decodeURIComponent(familyEncoded).replace(/\+/g, ' ')

  if (availableFonts.value.some(f => f.value === family)) {
    customError.value = 'Font already installed.'
    isLoadingCustom.value = false
    return
  }

  try {
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = url

    link.onload = () => {
      availableFonts.value.push({ name: family, value: family })
      loadedFonts.value.push(family)
      localStorage.setItem('loadedFonts', JSON.stringify(loadedFonts.value))
      customUrl.value = ''
      isLoadingCustom.value = false
      marketplaceTab.value = 'installed' // Switch to installed tab after adding
    }

    link.onerror = () => {
      customError.value = 'Failed to load custom font.'
      isLoadingCustom.value = false
    }

    document.head.appendChild(link)
  } catch (error) {
    console.error('Custom font loading error:', error)
    customError.value = 'Error loading custom font.'
    isLoadingCustom.value = false
  }
}

const handleReset = () => {
  resetSettings()
  modelValue.value = false
}

watch(modelValue, (newVal) => {
  if (newVal) {
    marketplaceSearch.value = ''
  }
})

onMounted(async () => {
  if (import.meta.client) {
    const stored = localStorage.getItem('loadedFonts')
    if (stored) {
      loadedFonts.value = JSON.parse(stored)
    }

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000)

      const response = await $fetch('https://www.googleapis.com/webfonts/v1/webfonts?key=AIzaSyDUu_V0wRh0GJkSjuLaJJbxZJBCBDVqrfk&sort=popularity', {
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      
      downloadableFonts.value = response.items
        .filter(item => item.subsets && item.subsets.includes('japanese'))
        .slice(0, 50)
        .map(item => ({
          name: item.family,
          value: item.family,
          url: `https://fonts.googleapis.com/css2?family=${item.family.replace(/ /g, '+')}:wght@300;400;500;700&display=swap&subset=japanese`
        }))

      for (const fontValue of loadedFonts.value) {
        const existing = availableFonts.value.find(f => f.value === fontValue)
        if (!existing) {
          const font = downloadableFonts.value.find(f => f.value === fontValue) || fallbackFonts.find(f => f.value === fontValue)
          if (font) {
            const existingLink = Array.from(document.querySelectorAll('link[href]')).some(link => 
              link.href.includes(font.value.replace(/ /g, '+'))
            )
            if (!existingLink) {
              const link = document.createElement('link')
              link.rel = 'stylesheet'
              link.href = font.url
              document.head.appendChild(link)
            }
            availableFonts.value.push(font)
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch Google Fonts, using fallback:', error)
      downloadableFonts.value = fallbackFonts
      
      for (const fontValue of loadedFonts.value) {
        const existing = availableFonts.value.find(f => f.value === fontValue)
        if (!existing) {
          const font = fallbackFonts.find(f => f.value === fontValue)
          if (font) {
            availableFonts.value.push(font)
          }
        }
      }
    }
  }
})
</script>