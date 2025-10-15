<template>
  <div v-if="modelValue" class="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4" @click.self="closeModal">
    <div class="bg-base-100 rounded-lg shadow-xl w-full flex flex-col" :class="containerClass">
      <div class="sticky top-0 bg-base-100 border-b border-base-300 p-4 sm:p-6 flex items-center justify-between z-10 flex-shrink-0">
        <h2 class="text-xl sm:text-2xl font-bold">Reader Settings</h2>
        <button @click="closeModal" class="btn btn-ghost btn-sm btn-circle">
          <IconX class="w-5 h-5" />
        </button>
      </div>

      <div class="flex flex-1 overflow-hidden min-h-0">
        <div class="hidden sm:block w-48 lg:w-64 border-r border-base-300 overflow-y-auto custom-scrollbar flex-shrink-0">
          <div class="menu p-2 lg:p-4">
            <li 
              v-for="tab in tabs" 
              :key="tab.id"
              @click="activeTab = tab.id"
            >
              <a :class="{ 'active bg-primary text-primary-content': activeTab === tab.id }" class="text-sm lg:text-base">
                <component :is="tab.icon" class="w-4 h-4 lg:w-5 lg:h-5 flex-shrink-0" />
                <span class="hidden lg:inline">{{ tab.label }}</span>
              </a>
            </li>
          </div>
        </div>

        <div class="sm:hidden w-full border-b border-base-300 flex-shrink-0">
          <select v-model="activeTab" class="select select-bordered w-full rounded-none">
            <option v-for="tab in tabs" :key="tab.id" :value="tab.id">
              {{ tab.label }}
            </option>
          </select>
        </div>

        <div class="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6 min-h-0">
          <div v-show="activeTab === 'typography'" class="space-y-4 sm:space-y-6">
            <h3 class="text-base sm:text-lg font-bold mb-3 sm:mb-4">Typography</h3>
            
            <div class="form-control">
              <label class="label">
                <span class="label-text font-medium text-sm sm:text-base">Font Family</span>
              </label>
              <select v-model="localSettings.fontFamily" class="select select-bordered w-full select-sm sm:select-md">
                <option value="Noto Sans JP">Noto Sans JP</option>
                <option value="Noto Serif JP">Noto Serif JP</option>
                <option value="M PLUS Rounded 1c">M PLUS Rounded</option>
                <option value="Kosugi Maru">Kosugi Maru</option>
                <option value="Sawarabi Mincho">Sawarabi Mincho</option>
                <option value="Yu Mincho">Yu Mincho</option>
                <option value="Hiragino Sans">Hiragino Sans</option>
              </select>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div class="form-control">
                <label class="label">
                  <span class="label-text font-medium text-sm sm:text-base">Font Size</span>
                  <span class="label-text-alt text-xs sm:text-sm">{{ localSettings.fontSize }}px</span>
                </label>
                <input 
                  v-model.number="localSettings.fontSize" 
                  type="range" 
                  min="16" 
                  max="48" 
                  step="2"
                  class="range range-primary range-sm"
                />
              </div>

              <div class="form-control">
                <label class="label">
                  <span class="label-text font-medium text-sm sm:text-base">Font Weight</span>
                </label>
                <select v-model.number="localSettings.fontWeight" class="select select-bordered select-sm w-full">
                  <option :value="300">Light</option>
                  <option :value="400">Regular</option>
                  <option :value="500">Medium</option>
                  <option :value="700">Bold</option>
                </select>
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div class="form-control">
                <label class="label">
                  <span class="label-text font-medium text-sm sm:text-base">Line Height</span>
                  <span class="label-text-alt text-xs sm:text-sm">{{ localSettings.lineHeight }}</span>
                </label>
                <input 
                  v-model.number="localSettings.lineHeight" 
                  type="range" 
                  min="1.5" 
                  max="3.5" 
                  step="0.1"
                  class="range range-primary range-sm"
                />
              </div>

              <div class="form-control">
                <label class="label">
                  <span class="label-text font-medium text-sm sm:text-base">Letter Spacing</span>
                  <span class="label-text-alt text-xs sm:text-sm">{{ localSettings.letterSpacing }}em</span>
                </label>
                <input 
                  v-model.number="localSettings.letterSpacing" 
                  type="range" 
                  min="0" 
                  max="0.2" 
                  step="0.01"
                  class="range range-primary range-sm"
                />
              </div>
            </div>
          </div>

          <div v-show="activeTab === 'furigana'" class="space-y-4 sm:space-y-6">
            <h3 class="text-base sm:text-lg font-bold mb-3 sm:mb-4">Furigana Settings</h3>

            <div class="form-control">
              <label class="label cursor-pointer">
                <span class="label-text font-medium text-sm sm:text-base">Always Show Furigana</span>
                <input v-model="localSettings.showFurigana" type="checkbox" class="toggle toggle-primary toggle-sm sm:toggle-md" />
              </label>
              <label class="label">
                <span class="label-text-alt text-xs sm:text-sm">Display reading above all kanji characters</span>
              </label>
            </div>

            <div class="form-control">
              <label class="label">
                <span class="label-text font-medium text-sm sm:text-base">Furigana Size</span>
                <span class="label-text-alt text-xs sm:text-sm">{{ localSettings.furiganaSize }}em</span>
              </label>
              <input 
                v-model.number="localSettings.furiganaSize" 
                type="range" 
                min="0.3" 
                max="0.6" 
                step="0.05"
                class="range range-primary range-sm"
              />
            </div>

            <div class="form-control">
              <label class="label">
                <span class="label-text font-medium text-sm sm:text-base">Furigana Color</span>
              </label>
              <div class="flex gap-2">
                <input 
                  v-model="localSettings.furiganaColor" 
                  type="color" 
                  class="w-16 sm:w-20 h-10 sm:h-12 rounded-lg cursor-pointer"
                />
                <button 
                  @click="localSettings.furiganaColor = ''"
                  class="btn btn-outline btn-sm flex-1"
                >
                  Use Default
                </button>
              </div>
            </div>
          </div>

          <div v-show="activeTab === 'tooltip'" class="space-y-4 sm:space-y-6">
            <h3 class="text-base sm:text-lg font-bold mb-3 sm:mb-4">Tooltip Settings</h3>

            <div class="form-control">
              <label class="label cursor-pointer">
                <span class="label-text font-medium text-sm sm:text-base">Enable Tooltips</span>
                <input v-model="localSettings.showTooltip" type="checkbox" class="toggle toggle-primary toggle-sm sm:toggle-md" />
              </label>
              <label class="label">
                <span class="label-text-alt text-xs sm:text-sm">Show reading and meaning on hover</span>
              </label>
            </div>

            <div class="form-control">
              <label class="label">
                <span class="label-text font-medium text-sm sm:text-base">Tooltip Size</span>
              </label>
              <select v-model="localSettings.tooltipSize" class="select select-bordered select-sm w-full">
                <option value="sm">Small</option>
                <option value="md">Medium</option>
                <option value="lg">Large</option>
              </select>
            </div>

            <div class="form-control">
              <label class="label cursor-pointer">
                <span class="label-text font-medium text-sm sm:text-base">Always Show Translation</span>
                <input v-model="localSettings.alwaysShowTranslation" type="checkbox" class="toggle toggle-primary toggle-sm sm:toggle-md" />
              </label>
              <label class="label">
                <span class="label-text-alt text-xs sm:text-sm">Display English meaning above each word</span>
              </label>
            </div>

            <div class="form-control">
              <label class="label">
                <span class="label-text font-medium text-sm sm:text-base">Translation Size</span>
                <span class="label-text-alt text-xs sm:text-sm">{{ localSettings.translationSize }}px</span>
              </label>
              <input 
                v-model.number="localSettings.translationSize" 
                type="range" 
                min="8" 
                max="20" 
                step="1"
                class="range range-primary range-sm"
              />
            </div>

            <div class="form-control">
              <label class="label">
                <span class="label-text font-medium text-sm sm:text-base">Translation Gap</span>
                <span class="label-text-alt text-xs sm:text-sm">{{ localSettings.translationGap }}px</span>
              </label>
              <input 
                v-model.number="localSettings.translationGap" 
                type="range" 
                min="2" 
                max="20" 
                step="1"
                class="range range-primary range-sm"
              />
              <label class="label">
                <span class="label-text-alt text-xs sm:text-sm">Space between translation and word</span>
              </label>
            </div>

            <div class="form-control">
              <label class="label">
                <span class="label-text font-medium text-sm sm:text-base">Tooltip Delay</span>
                <span class="label-text-alt text-xs sm:text-sm">{{ localSettings.tooltipDelay }}ms</span>
              </label>
              <input 
                v-model.number="localSettings.tooltipDelay" 
                type="range" 
                min="0" 
                max="1000" 
                step="50"
                class="range range-primary range-sm"
              />
            </div>

            <div class="form-control">
              <label class="label cursor-pointer">
                <span class="label-text font-medium text-sm sm:text-base">Click to Toggle Word Details</span>
                <input v-model="localSettings.clickToToggle" type="checkbox" class="toggle toggle-primary toggle-sm sm:toggle-md" />
              </label>
              <label class="label">
                <span class="label-text-alt text-xs sm:text-sm">Keep tooltip visible when clicking a word</span>
              </label>
            </div>
          </div>

          <div v-show="activeTab === 'highlighting'" class="space-y-4 sm:space-y-6">
            <h3 class="text-base sm:text-lg font-bold mb-3 sm:mb-4">Highlighting Options</h3>

            <div class="form-control">
              <label class="label cursor-pointer">
                <span class="label-text font-medium text-sm sm:text-base">Highlight on Hover</span>
                <input v-model="localSettings.highlightOnHover" type="checkbox" class="toggle toggle-primary toggle-sm sm:toggle-md" />
              </label>
            </div>

            <div class="form-control">
              <label class="label cursor-pointer">
                <span class="label-text font-medium text-sm sm:text-base">Highlight Particles</span>
                <input v-model="localSettings.highlightParticles" type="checkbox" class="toggle toggle-primary toggle-sm sm:toggle-md" />
              </label>
              <label class="label">
                <span class="label-text-alt text-xs sm:text-sm">は, が, を, の, etc.</span>
              </label>
            </div>

            <div class="form-control">
              <label class="label cursor-pointer">
                <span class="label-text font-medium text-sm sm:text-base">Highlight Verbs</span>
                <input v-model="localSettings.highlightVerbs" type="checkbox" class="toggle toggle-primary toggle-sm sm:toggle-md" />
              </label>
            </div>

            <div class="form-control">
              <label class="label cursor-pointer">
                <span class="label-text font-medium text-sm sm:text-base">Highlight Adjectives</span>
                <input v-model="localSettings.highlightAdjectives" type="checkbox" class="toggle toggle-primary toggle-sm sm:toggle-md" />
              </label>
            </div>

            <div class="form-control">
              <label class="label cursor-pointer">
                <span class="label-text font-medium text-sm sm:text-base">Underline Unknown Words</span>
                <input v-model="localSettings.underlineUnknown" type="checkbox" class="toggle toggle-primary toggle-sm sm:toggle-md" />
              </label>
            </div>
          </div>

          <div v-show="activeTab === 'display'" class="space-y-4 sm:space-y-6">
            <h3 class="text-base sm:text-lg font-bold mb-3 sm:mb-4">Display Options</h3>

            <div class="form-control">
              <label class="label">
                <span class="label-text font-medium text-sm sm:text-base">Text Alignment</span>
              </label>
              <div class="grid grid-cols-3 gap-2">
                <button 
                  @click="localSettings.textAlign = 'left'"
                  class="btn btn-sm"
                  :class="{ 'btn-primary': localSettings.textAlign === 'left' }"
                >
                  <IconAlignLeft class="w-4 h-4" />
                </button>
                <button 
                  @click="localSettings.textAlign = 'center'"
                  class="btn btn-sm"
                  :class="{ 'btn-primary': localSettings.textAlign === 'center' }"
                >
                  <IconAlignCenter class="w-4 h-4" />
                </button>
                <button 
                  @click="localSettings.textAlign = 'justify'"
                  class="btn btn-sm"
                  :class="{ 'btn-primary': localSettings.textAlign === 'justify' }"
                >
                  <IconAlignJustify class="w-4 h-4" />
                </button>
              </div>
            </div>

            <div class="form-control">
              <label class="label">
                <span class="label-text font-medium text-sm sm:text-base">Max Width</span>
              </label>
              <select v-model="localSettings.maxWidth" class="select select-bordered select-sm w-full">
                <option value="full">Full Width</option>
                <option value="4xl">Extra Large (1280px)</option>
                <option value="3xl">Large (1024px)</option>
                <option value="2xl">Medium (768px)</option>
                <option value="xl">Small (640px)</option>
              </select>
            </div>

            <div class="form-control">
              <label class="label">
                <span class="label-text font-medium text-sm sm:text-base">Text Color</span>
              </label>
              <div class="flex gap-2">
                <input 
                  v-model="localSettings.textColor" 
                  type="color" 
                  class="w-16 sm:w-20 h-10 sm:h-12 rounded-lg cursor-pointer"
                />
                <button 
                  @click="localSettings.textColor = ''"
                  class="btn btn-outline btn-sm flex-1"
                >
                  Use Theme Default
                </button>
              </div>
            </div>

            <div class="form-control">
              <label class="label">
                <span class="label-text font-medium text-sm sm:text-base">Background Color</span>
              </label>
              <div class="flex gap-2">
                <input 
                  v-model="localSettings.backgroundColor" 
                  type="color" 
                  class="w-16 sm:w-20 h-10 sm:h-12 rounded-lg cursor-pointer"
                />
                <button 
                  @click="localSettings.backgroundColor = ''"
                  class="btn btn-outline btn-sm flex-1"
                >
                  Use Theme Default
                </button>
              </div>
            </div>

            <div class="form-control">
              <label class="label cursor-pointer">
                <span class="label-text font-medium text-sm sm:text-base">Show Word Spacing</span>
                <input v-model="localSettings.showWordSpacing" type="checkbox" class="toggle toggle-primary toggle-sm sm:toggle-md" />
              </label>
              <label class="label">
                <span class="label-text-alt text-xs sm:text-sm">Add space between words</span>
              </label>
            </div>

            <div class="form-control">
              <label class="label cursor-pointer">
                <span class="label-text font-medium text-sm sm:text-base">Vertical Text Mode</span>
                <input v-model="localSettings.verticalText" type="checkbox" class="toggle toggle-primary toggle-sm sm:toggle-md" />
              </label>
              <label class="label">
                <span class="label-text-alt text-xs sm:text-sm">Traditional vertical reading layout</span>
              </label>
            </div>
          </div>

          <div v-show="activeTab === 'reading'" class="space-y-4 sm:space-y-6">
            <h3 class="text-base sm:text-lg font-bold mb-3 sm:mb-4">Reading Aids</h3>

            <div class="form-control">
              <label class="label cursor-pointer">
                <span class="label-text font-medium text-sm sm:text-base">Show Sentence Numbers</span>
                <input v-model="localSettings.showSentenceNumbers" type="checkbox" class="toggle toggle-primary toggle-sm sm:toggle-md" />
              </label>
            </div>

            <div class="form-control">
              <label class="label cursor-pointer">
                <span class="label-text font-medium text-sm sm:text-base">Show Part of Speech</span>
                <input v-model="localSettings.showPartOfSpeech" type="checkbox" class="toggle toggle-primary toggle-sm sm:toggle-md" />
              </label>
            </div>

            <div class="form-control">
              <label class="label cursor-pointer">
                <span class="label-text font-medium text-sm sm:text-base">Show Pitch Accent</span>
                <input v-model="localSettings.showPitchAccent" type="checkbox" class="toggle toggle-primary toggle-sm sm:toggle-md" />
              </label>
            </div>

            <div class="form-control">
              <label class="label">
                <span class="label-text font-medium text-sm sm:text-base">Focus Mode Opacity</span>
                <span class="label-text-alt text-xs sm:text-sm">{{ localSettings.focusModeOpacity }}%</span>
              </label>
              <input 
                v-model.number="localSettings.focusModeOpacity" 
                type="range" 
                min="0" 
                max="100" 
                step="5"
                class="range range-primary range-sm"
              />
              <label class="label">
                <span class="label-text-alt text-xs sm:text-sm">Dim non-hovered text in focus mode</span>
              </label>
            </div>

            <div class="form-control">
              <label class="label cursor-pointer">
                <span class="label-text font-medium text-sm sm:text-base">Auto-scroll on Sentence Hover</span>
                <input v-model="localSettings.autoScroll" type="checkbox" class="toggle toggle-primary toggle-sm sm:toggle-md" />
              </label>
            </div>
          </div>

          <div v-show="activeTab === 'generation'" class="space-y-4 sm:space-y-6">
            <h3 class="text-base sm:text-lg font-bold mb-3 sm:mb-4">Generation Settings</h3>

            <div class="form-control">
              <label class="label">
                <span class="label-text font-medium text-sm sm:text-base">JLPT Level</span>
              </label>
              <select v-model="localSettings.jlptLevel" class="select select-bordered select-sm w-full">
                <option value="N5">N5 (Beginner)</option>
                <option value="N4">N4 (Elementary)</option>
                <option value="N3">N3 (Intermediate)</option>
                <option value="N2">N2 (Upper Intermediate)</option>
                <option value="N1">N1 (Advanced)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div class="border-t border-base-300 p-4 sm:p-6 bg-base-100 flex-shrink-0">
        <div class="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-end">
          <button @click="handleReset" class="btn btn-outline btn-sm sm:btn-md w-full sm:w-auto">
            <IconRotateCcw class="w-4 h-4" />
            Reset to Defaults
          </button>
          <button @click="closeModal" class="btn btn-primary btn-sm sm:btn-md w-full sm:w-auto">
            Done
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import IconX from '~icons/lucide/x'
import IconType from '~icons/lucide/type'
import IconLanguages from '~icons/lucide/languages'
import IconMessageSquare from '~icons/lucide/message-square'
import IconHighlighter from '~icons/lucide/highlighter'
import IconEye from '~icons/lucide/eye'
import IconBookOpen from '~icons/lucide/book-open'
import IconAlignLeft from '~icons/lucide/align-left'
import IconAlignCenter from '~icons/lucide/align-center'
import IconAlignJustify from '~icons/lucide/align-justify'
import IconRotateCcw from '~icons/lucide/rotate-ccw'
import IconSparkles from '~icons/lucide/sparkles'

const props = defineProps({
  modelValue: Boolean,
  settings: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['update:modelValue', 'update:settings', 'reset'])

const activeTab = ref('typography')
const localSettings = ref({ ...props.settings })

const containerClass = computed(() => {
  return 'max-w-5xl h-[85vh] sm:h-[600px]'
})

const tabs = [
  { id: 'typography', label: 'Typography', icon: IconType },
  { id: 'furigana', label: 'Furigana', icon: IconLanguages },
  { id: 'tooltip', label: 'Tooltips', icon: IconMessageSquare },
  { id: 'highlighting', label: 'Highlighting', icon: IconHighlighter },
  { id: 'display', label: 'Display', icon: IconEye },
  { id: 'reading', label: 'Reading Aids', icon: IconBookOpen },
  { id: 'generation', label: 'Generation', icon: IconSparkles }
]

watch(() => props.settings, (newSettings) => {
  localSettings.value = { ...newSettings }
}, { deep: true })

watch(localSettings, (newSettings) => {
  emit('update:settings', { ...newSettings })
}, { deep: true })

const closeModal = () => {
  emit('update:modelValue', false)
}

const handleReset = () => {
  emit('reset')
}
</script>