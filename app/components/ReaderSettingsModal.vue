<template>
  <div v-if="modelValue" class="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4" @click.self="closeModal">
    <div class="bg-base-100 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
      <div class="p-4 sm:p-6 border-b border-base-300 flex items-center justify-between">
        <h2 class="text-xl sm:text-2xl font-bold">Reader Settings</h2>
        <button @click="closeModal" class="btn btn-ghost btn-sm btn-circle">
          <IconX class="w-5 h-5" />
        </button>
      </div>

      <div class="flex-1 overflow-y-auto custom-scrollbar">
        <div class="flex flex-col sm:flex-row">
          <div class="sm:w-48 border-b sm:border-b-0 sm:border-r border-base-300">
            <div class="p-2 sm:p-4 space-y-1">
              <button 
                v-for="tab in tabs" 
                :key="tab.id"
                @click="activeTab = tab.id"
                class="btn btn-ghost btn-sm w-full justify-start gap-2"
                :class="{ 'btn-active': activeTab === tab.id }"
              >
                <component :is="tab.icon" class="w-4 h-4" />
                <span class="hidden sm:inline">{{ tab.label }}</span>
              </button>
            </div>
          </div>

          <div class="flex-1 p-4 sm:p-6">
            <div v-show="activeTab === 'typography'" class="space-y-4 sm:space-y-6">
              <h3 class="text-base sm:text-lg font-bold mb-3 sm:mb-4">Typography</h3>

              <div class="form-control">
                <label class="label">
                  <span class="label-text font-medium text-sm sm:text-base">Font Family</span>
                </label>
                <select v-model="localSettings.fontFamily" class="select select-bordered w-full text-sm sm:text-base">
                  <option value="Noto Sans JP">Noto Sans JP</option>
                  <option value="Noto Serif JP">Noto Serif JP</option>
                  <option value="M PLUS Rounded 1c">M PLUS Rounded</option>
                  <option value="Zen Kaku Gothic New">Zen Kaku Gothic</option>
                  <option value="Zen Maru Gothic">Zen Maru Gothic</option>
                  <option value="Sawarabi Gothic">Sawarabi Gothic</option>
                  <option value="Sawarabi Mincho">Sawarabi Mincho</option>
                  <option value="Kosugi Maru">Kosugi Maru</option>
                  <option value="Kosugi">Kosugi</option>
                  <option value="Yuji Syuku">Yuji Syuku</option>
                </select>
              </div>

              <div class="form-control">
                <label class="label">
                  <span class="label-text font-medium text-sm sm:text-base">Font Size: {{ localSettings.fontSize }}px</span>
                </label>
                <input v-model.number="localSettings.fontSize" type="range" min="16" max="48" class="range range-primary range-sm sm:range-md" />
              </div>

              <div class="form-control">
                <label class="label">
                  <span class="label-text font-medium text-sm sm:text-base">Font Weight: {{ localSettings.fontWeight }}</span>
                </label>
                <input v-model.number="localSettings.fontWeight" type="range" min="300" max="700" step="100" class="range range-primary range-sm sm:range-md" />
              </div>

              <div class="form-control">
                <label class="label">
                  <span class="label-text font-medium text-sm sm:text-base">Line Height: {{ localSettings.lineHeight.toFixed(1) }}</span>
                </label>
                <input v-model.number="localSettings.lineHeight" type="range" min="1.5" max="3.5" step="0.1" class="range range-primary range-sm sm:range-md" />
              </div>

              <div class="form-control">
                <label class="label">
                  <span class="label-text font-medium text-sm sm:text-base">Letter Spacing: {{ localSettings.letterSpacing }}px</span>
                </label>
                <input v-model.number="localSettings.letterSpacing" type="range" min="0" max="8" step="1" class="range range-primary range-sm sm:range-md" />
              </div>

              <div class="form-control">
                <label class="label">
                  <span class="label-text font-medium text-sm sm:text-base">Text Align</span>
                </label>
                <select v-model="localSettings.textAlign" class="select select-bordered w-full text-sm sm:text-base">
                  <option value="left">Left</option>
                  <option value="center">Center</option>
                  <option value="right">Right</option>
                  <option value="justify">Justify</option>
                </select>
              </div>

              <div class="form-control">
                <label class="label">
                  <span class="label-text font-medium text-sm sm:text-base">Max Width</span>
                </label>
                <select v-model="localSettings.maxWidth" class="select select-bordered w-full text-sm sm:text-base">
                  <option value="full">Full Width</option>
                  <option value="2xl">Reading Width (42rem)</option>
                  <option value="4xl">Wide (56rem)</option>
                  <option value="6xl">Extra Wide (72rem)</option>
                </select>
              </div>

              <div class="form-control">
                <label class="label cursor-pointer">
                  <span class="label-text font-medium text-sm sm:text-base">Word Spacing</span>
                  <input v-model="localSettings.showWordSpacing" type="checkbox" class="toggle toggle-primary toggle-sm sm:toggle-md" />
                </label>
              </div>

              <div class="form-control">
                <label class="label cursor-pointer">
                  <span class="label-text font-medium text-sm sm:text-base">Vertical Text</span>
                  <input v-model="localSettings.verticalText" type="checkbox" class="toggle toggle-primary toggle-sm sm:toggle-md" />
                </label>
              </div>
            </div>

            <div v-show="activeTab === 'furigana'" class="space-y-4 sm:space-y-6">
              <h3 class="text-base sm:text-lg font-bold mb-3 sm:mb-4">Furigana Settings</h3>

              <div class="form-control">
                <label class="label cursor-pointer">
                  <span class="label-text font-medium text-sm sm:text-base">Show Furigana</span>
                  <input v-model="localSettings.showFurigana" type="checkbox" class="toggle toggle-primary toggle-sm sm:toggle-md" />
                </label>
              </div>

              <div class="form-control">
                <label class="label">
                  <span class="label-text font-medium text-sm sm:text-base">Furigana Size: {{ (localSettings.furiganaSize * 100).toFixed(0) }}%</span>
                </label>
                <input v-model.number="localSettings.furiganaSize" type="range" min="0.3" max="0.7" step="0.05" class="range range-primary range-sm sm:range-md" />
              </div>

              <div class="form-control">
                <label class="label">
                  <span class="label-text font-medium text-sm sm:text-base">Furigana Color</span>
                </label>
                <input v-model="localSettings.furiganaColor" type="color" class="input input-bordered w-full h-12" />
                <label class="label">
                  <span class="label-text-alt text-xs sm:text-sm">Leave empty for default color</span>
                </label>
              </div>

              <div class="form-control">
                <label class="label cursor-pointer">
                  <span class="label-text font-medium text-sm sm:text-base">Show Pitch Accent</span>
                  <input v-model="localSettings.showPitchAccent" type="checkbox" class="toggle toggle-primary toggle-sm sm:toggle-md" />
                </label>
              </div>
            </div>

            <div v-show="activeTab === 'translation'" class="space-y-4 sm:space-y-6">
              <h3 class="text-base sm:text-lg font-bold mb-3 sm:mb-4">Translation Settings</h3>

              <div class="form-control">
                <label class="label cursor-pointer">
                  <span class="label-text font-medium text-sm sm:text-base">Always Show Translation</span>
                  <input v-model="localSettings.alwaysShowTranslation" type="checkbox" class="toggle toggle-primary toggle-sm sm:toggle-md" />
                </label>
                <label class="label">
                  <span class="label-text-alt text-xs sm:text-sm">Display English above each word</span>
                </label>
              </div>

              <div class="form-control">
                <label class="label">
                  <span class="label-text font-medium text-sm sm:text-base">Translation Size: {{ localSettings.translationSize }}px</span>
                </label>
                <input v-model.number="localSettings.translationSize" type="range" min="8" max="16" step="1" class="range range-primary range-sm sm:range-md" />
              </div>

              <div class="form-control">
                <label class="label">
                  <span class="label-text font-medium text-sm sm:text-base">Translation Gap: {{ localSettings.translationGap }}px</span>
                </label>
                <input v-model.number="localSettings.translationGap" type="range" min="0" max="12" step="1" class="range range-primary range-sm sm:range-md" />
              </div>

              <div class="form-control">
                <label class="label cursor-pointer">
                  <span class="label-text font-medium text-sm sm:text-base">Show Tooltips</span>
                  <input v-model="localSettings.showTooltip" type="checkbox" class="toggle toggle-primary toggle-sm sm:toggle-md" />
                </label>
              </div>

              <div class="form-control">
                <label class="label">
                  <span class="label-text font-medium text-sm sm:text-base">Tooltip Size</span>
                </label>
                <select v-model="localSettings.tooltipSize" class="select select-bordered w-full text-sm sm:text-base">
                  <option value="sm">Small</option>
                  <option value="md">Medium</option>
                  <option value="lg">Large</option>
                </select>
              </div>

              <div class="form-control">
                <label class="label cursor-pointer">
                  <span class="label-text font-medium text-sm sm:text-base">Show Part of Speech</span>
                  <input v-model="localSettings.showPartOfSpeech" type="checkbox" class="toggle toggle-primary toggle-sm sm:toggle-md" />
                </label>
              </div>
            </div>

            <div v-show="activeTab === 'highlighting'" class="space-y-4 sm:space-y-6">
              <h3 class="text-base sm:text-lg font-bold mb-3 sm:mb-4">Color Highlighting</h3>

              <div class="alert alert-info text-sm">
                <IconInfo class="w-4 h-4" />
                <span>Words will be colored based on their grammatical function</span>
              </div>

              <div class="form-control">
                <label class="label cursor-pointer">
                  <span class="label-text font-medium text-sm sm:text-base">Highlight Particles</span>
                  <input v-model="localSettings.highlightParticles" type="checkbox" class="toggle toggle-sm sm:toggle-md" style="--tglbg: #F59E0B" />
                </label>
                <label class="label">
                  <span class="label-text-alt text-xs sm:text-sm flex items-center gap-2">
                    <span class="w-3 h-3 rounded-full" style="background: #F59E0B"></span>
                    は、を、に、で, etc. (Orange)
                  </span>
                </label>
              </div>

              <div class="form-control">
                <label class="label cursor-pointer">
                  <span class="label-text font-medium text-sm sm:text-base">Highlight Verbs</span>
                  <input v-model="localSettings.highlightVerbs" type="checkbox" class="toggle toggle-sm sm:toggle-md" style="--tglbg: #10B981" />
                </label>
                <label class="label">
                  <span class="label-text-alt text-xs sm:text-sm flex items-center gap-2">
                    <span class="w-3 h-3 rounded-full" style="background: #10B981"></span>
                    Action words (Green)
                  </span>
                </label>
              </div>

              <div class="form-control">
                <label class="label cursor-pointer">
                  <span class="label-text font-medium text-sm sm:text-base">Highlight Adjectives</span>
                  <input v-model="localSettings.highlightAdjectives" type="checkbox" class="toggle toggle-sm sm:toggle-md" style="--tglbg: #8B5CF6" />
                </label>
                <label class="label">
                  <span class="label-text-alt text-xs sm:text-sm flex items-center gap-2">
                    <span class="w-3 h-3 rounded-full" style="background: #8B5CF6"></span>
                    Describing words (Purple)
                  </span>
                </label>
              </div>

              <div class="divider">Known Words (from Anki)</div>

              <div class="form-control">
                <label class="label cursor-pointer">
                  <span class="label-text font-medium text-sm sm:text-base">Highlight Known Words</span>
                  <input v-model="localSettings.highlightKnownWords" type="checkbox" class="toggle toggle-success toggle-sm sm:toggle-md" />
                </label>
                <label class="label">
                  <span class="label-text-alt text-xs sm:text-sm">Green background for words you know</span>
                </label>
              </div>

              <div class="form-control">
                <label class="label cursor-pointer">
                  <span class="label-text font-medium text-sm sm:text-base">Dim Known Words</span>
                  <input v-model="localSettings.dimKnownWords" type="checkbox" class="toggle toggle-primary toggle-sm sm:toggle-md" />
                </label>
                <label class="label">
                  <span class="label-text-alt text-xs sm:text-sm">Lower opacity for known words</span>
                </label>
              </div>

              <div class="form-control">
                <label class="label cursor-pointer">
                  <span class="label-text font-medium text-sm sm:text-base">Strikethrough Known Words</span>
                  <input v-model="localSettings.strikethroughKnown" type="checkbox" class="toggle toggle-primary toggle-sm sm:toggle-md" />
                </label>
                <label class="label">
                  <span class="label-text-alt text-xs sm:text-sm">Cross out words you already know</span>
                </label>
              </div>

              <div class="form-control">
                <label class="label cursor-pointer">
                  <span class="label-text font-medium text-sm sm:text-base">Underline Unknown Words</span>
                  <input v-model="localSettings.underlineUnknown" type="checkbox" class="toggle toggle-primary toggle-sm sm:toggle-md" />
                </label>
              </div>
            </div>

            <div v-show="activeTab === 'colors'" class="space-y-4 sm:space-y-6">
              <h3 class="text-base sm:text-lg font-bold mb-3 sm:mb-4">Color Settings</h3>

              <div class="form-control">
                <label class="label">
                  <span class="label-text font-medium text-sm sm:text-base">Text Color</span>
                </label>
                <input v-model="localSettings.textColor" type="color" class="input input-bordered w-full h-12" />
                <label class="label">
                  <span class="label-text-alt text-xs sm:text-sm">Leave empty for theme default</span>
                </label>
              </div>

              <div class="form-control">
                <label class="label">
                  <span class="label-text font-medium text-sm sm:text-base">Background Color</span>
                </label>
                <input v-model="localSettings.backgroundColor" type="color" class="input input-bordered w-full h-12" />
                <label class="label">
                  <span class="label-text-alt text-xs sm:text-sm">Leave empty for theme default</span>
                </label>
              </div>
            </div>

            <div v-show="activeTab === 'behavior'" class="space-y-4 sm:space-y-6">
              <h3 class="text-base sm:text-lg font-bold mb-3 sm:mb-4">Behavior Settings</h3>

              <div class="form-control">
                <label class="label">
                  <span class="label-text font-medium text-sm sm:text-base">JLPT Level</span>
                </label>
                <select v-model="localSettings.jlptLevel" class="select select-bordered w-full text-sm sm:text-base">
                  <option value="N5">N5 (Beginner)</option>
                  <option value="N4">N4</option>
                  <option value="N3">N3 (Intermediate)</option>
                  <option value="N2">N2</option>
                  <option value="N1">N1 (Advanced)</option>
                </select>
                <label class="label">
                  <span class="label-text-alt text-xs sm:text-sm">Difficulty of generated text</span>
                </label>
              </div>

              <div class="form-control">
                <label class="label cursor-pointer">
                  <span class="label-text font-medium text-sm sm:text-base">Click to Toggle Details</span>
                  <input v-model="localSettings.clickToToggle" type="checkbox" class="toggle toggle-primary toggle-sm sm:toggle-md" />
                </label>
              </div>

              <div class="form-control">
                <label class="label cursor-pointer">
                  <span class="label-text font-medium text-sm sm:text-base">Show Sentence Numbers</span>
                  <input v-model="localSettings.showSentenceNumbers" type="checkbox" class="toggle toggle-primary toggle-sm sm:toggle-md" />
                </label>
              </div>

              <div class="form-control">
                <label class="label cursor-pointer">
                  <span class="label-text font-medium text-sm sm:text-base">Auto Scroll</span>
                  <input v-model="localSettings.autoScroll" type="checkbox" class="toggle toggle-primary toggle-sm sm:toggle-md" />
                </label>
              </div>

              <div class="form-control">
                <label class="label">
                  <span class="label-text font-medium text-sm sm:text-base">Focus Mode Opacity: {{ localSettings.focusModeOpacity }}%</span>
                </label>
                <input v-model.number="localSettings.focusModeOpacity" type="range" min="10" max="80" step="5" class="range range-primary range-sm sm:range-md" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="p-4 sm:p-6 border-t border-base-300 flex gap-3 justify-end">
        <button @click="handleReset" class="btn btn-outline btn-sm sm:btn-md">
          <IconRotateCcw class="w-4 h-4" />
          Reset
        </button>
        <button @click="handleSave" class="btn btn-primary btn-sm sm:btn-md">
          <IconCheck class="w-4 h-4" />
          Save
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import IconX from '~icons/lucide/x'
import IconType from '~icons/lucide/type'
import IconLanguages from '~icons/lucide/languages'
import IconHighlighter from '~icons/lucide/highlighter'
import IconPalette from '~icons/lucide/palette'
import IconSettings from '~icons/lucide/settings'
import IconCheck from '~icons/lucide/check'
import IconRotateCcw from '~icons/lucide/rotate-ccw'
import IconFileText from '~icons/lucide/file-text'
import IconInfo from '~icons/lucide/info'

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

const tabs = [
  { id: 'typography', label: 'Typography', icon: IconType },
  { id: 'furigana', label: 'Furigana', icon: IconFileText },
  { id: 'translation', label: 'Translation', icon: IconLanguages },
  { id: 'highlighting', label: 'Highlighting', icon: IconHighlighter },
  { id: 'colors', label: 'Colors', icon: IconPalette },
  { id: 'behavior', label: 'Behavior', icon: IconSettings }
]

const closeModal = () => {
  emit('update:modelValue', false)
}

const handleSave = () => {
  emit('update:settings', { ...localSettings.value })
  closeModal()
}

const handleReset = () => {
  emit('reset')
  closeModal()
}

watch(() => props.settings, (newSettings) => {
  localSettings.value = { ...newSettings }
}, { deep: true })

watch(() => props.modelValue, (newVal) => {
  if (newVal) {
    localSettings.value = { ...props.settings }
  }
})

watch(localSettings, (newSettings) => {
  emit('update:settings', { ...newSettings })
}, { deep: true })
</script>