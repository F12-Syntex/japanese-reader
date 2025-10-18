<template>
  <BaseModal :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)" title="Reader Settings" subtitle="Customize your reading experience" size="lg">
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
            <div v-show="activeTab === 'typography'" class="space-y-4">
              <h3 class="text-base font-bold mb-3">Typography</h3>

              <div class="form-control">
                <label class="label">
                  <span class="label-text font-medium text-sm">Font Family</span>
                </label>
                <select v-model="localSettings.fontFamily" class="select select-bordered select-sm w-full">
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
                  <span class="label-text font-medium text-sm">Font Size: {{ localSettings.fontSize }}px</span>
                </label>
                <input v-model.number="localSettings.fontSize" type="range" min="16" max="48" class="range range-primary range-xs" />
              </div>

              <div class="form-control">
                <label class="label">
                  <span class="label-text font-medium text-sm">Font Weight: {{ localSettings.fontWeight }}</span>
                </label>
                <input v-model.number="localSettings.fontWeight" type="range" min="300" max="700" step="100" class="range range-primary range-xs" />
              </div>

              <div class="form-control">
                <label class="label">
                  <span class="label-text font-medium text-sm">Line Height: {{ localSettings.lineHeight.toFixed(1) }}</span>
                </label>
                <input v-model.number="localSettings.lineHeight" type="range" min="1.5" max="3.5" step="0.1" class="range range-primary range-xs" />
              </div>

              <div class="form-control">
                <label class="label">
                  <span class="label-text font-medium text-sm">Letter Spacing: {{ localSettings.letterSpacing }}px</span>
                </label>
                <input v-model.number="localSettings.letterSpacing" type="range" min="0" max="8" step="1" class="range range-primary range-xs" />
              </div>

              <div class="form-control">
                <label class="label">
                  <span class="label-text font-medium text-sm">Text Align</span>
                </label>
                <select v-model="localSettings.textAlign" class="select select-bordered select-sm w-full">
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
                <select v-model="localSettings.maxWidth" class="select select-bordered select-sm w-full">
                  <option value="full">Full Width</option>
                  <option value="2xl">Reading Width (42rem)</option>
                  <option value="4xl">Wide (56rem)</option>
                  <option value="6xl">Extra Wide (72rem)</option>
                </select>
              </div>

              <div class="form-control">
                <label class="label cursor-pointer">
                  <span class="label-text font-medium text-sm">Word Spacing</span>
                  <input v-model="localSettings.showWordSpacing" type="checkbox" class="toggle toggle-primary toggle-sm" />
                </label>
              </div>

              <div class="form-control">
                <label class="label cursor-pointer">
                  <span class="label-text font-medium text-sm">Vertical Text</span>
                  <input v-model="localSettings.verticalText" type="checkbox" class="toggle toggle-primary toggle-sm" />
                </label>
              </div>
            </div>

            <div v-show="activeTab === 'furigana'" class="space-y-4">
              <h3 class="text-base font-bold mb-3">Furigana Settings</h3>

              <div class="form-control">
                <label class="label cursor-pointer">
                  <span class="label-text font-medium text-sm">Show Furigana</span>
                  <input v-model="localSettings.showFurigana" type="checkbox" class="toggle toggle-primary toggle-sm" />
                </label>
              </div>

              <div class="form-control">
                <label class="label">
                  <span class="label-text font-medium text-sm">Furigana Size: {{ (localSettings.furiganaSize * 100).toFixed(0) }}%</span>
                </label>
                <input v-model.number="localSettings.furiganaSize" type="range" min="0.3" max="0.7" step="0.05" class="range range-primary range-xs" />
              </div>

              <div class="form-control">
                <label class="label">
                  <span class="label-text font-medium text-sm">Furigana Color</span>
                </label>
                <input v-model="localSettings.furiganaColor" type="color" class="input input-bordered input-sm w-full h-10" />
                <label class="label">
                  <span class="label-text-alt text-xs">Leave empty for default color</span>
                </label>
              </div>

              <div class="form-control">
                <label class="label cursor-pointer">
                  <span class="label-text font-medium text-sm">Show Pitch Accent</span>
                  <input v-model="localSettings.showPitchAccent" type="checkbox" class="toggle toggle-primary toggle-sm" />
                </label>
              </div>
            </div>

            <div v-show="activeTab === 'translation'" class="space-y-4">
              <h3 class="text-base font-bold mb-3">Translation Settings</h3>

              <div class="form-control">
                <label class="label cursor-pointer">
                  <span class="label-text font-medium text-sm">Always Show Translation</span>
                  <input v-model="localSettings.alwaysShowTranslation" type="checkbox" class="toggle toggle-primary toggle-sm" />
                </label>
                <label class="label">
                  <span class="label-text-alt text-xs">Display English above each word</span>
                </label>
              </div>

              <div class="form-control">
                <label class="label">
                  <span class="label-text font-medium text-sm">Translation Size: {{ localSettings.translationSize }}px</span>
                </label>
                <input v-model.number="localSettings.translationSize" type="range" min="8" max="16" step="1" class="range range-primary range-xs" />
              </div>

              <div class="form-control">
                <label class="label">
                  <span class="label-text font-medium text-sm">Translation Gap: {{ localSettings.translationGap }}px</span>
                </label>
                <input v-model.number="localSettings.translationGap" type="range" min="0" max="12" step="1" class="range range-primary range-xs" />
              </div>

              <div class="form-control">
                <label class="label cursor-pointer">
                  <span class="label-text font-medium text-sm">Show Tooltips</span>
                  <input v-model="localSettings.showTooltip" type="checkbox" class="toggle toggle-primary toggle-sm" />
                </label>
              </div>

              <div class="form-control">
                <label class="label">
                  <span class="label-text font-medium text-sm">Tooltip Size</span>
                </label>
                <select v-model="localSettings.tooltipSize" class="select select-bordered select-sm w-full">
                  <option value="sm">Small</option>
                  <option value="md">Medium</option>
                  <option value="lg">Large</option>
                </select>
              </div>

              <div class="form-control">
                <label class="label cursor-pointer">
                  <span class="label-text font-medium text-sm">Show Part of Speech</span>
                  <input v-model="localSettings.showPartOfSpeech" type="checkbox" class="toggle toggle-primary toggle-sm" />
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
                  <input v-model="localSettings.highlightParticles" type="checkbox" class="toggle toggle-sm" style="--tglbg: #F59E0B" />
                </label>
                <label class="label">
                  <span class="label-text-alt text-xs flex items-center gap-2">
                    <span class="w-3 h-3 rounded-full" style="background: #F59E0B"></span>
                    は、を、に、で, etc. (Orange)
                  </span>
                </label>
              </div>

              <div class="form-control">
                <label class="label cursor-pointer">
                  <span class="label-text font-medium text-sm">Highlight Verbs</span>
                  <input v-model="localSettings.highlightVerbs" type="checkbox" class="toggle toggle-sm" style="--tglbg: #10B981" />
                </label>
                <label class="label">
                  <span class="label-text-alt text-xs flex items-center gap-2">
                    <span class="w-3 h-3 rounded-full" style="background: #10B981"></span>
                    Action words (Green)
                  </span>
                </label>
              </div>

              <div class="form-control">
                <label class="label cursor-pointer">
                  <span class="label-text font-medium text-sm">Highlight Adjectives</span>
                  <input v-model="localSettings.highlightAdjectives" type="checkbox" class="toggle toggle-sm" style="--tglbg: #8B5CF6" />
                </label>
                <label class="label">
                  <span class="label-text-alt text-xs flex items-center gap-2">
                    <span class="w-3 h-3 rounded-full" style="background: #8B5CF6"></span>
                    Describing words (Purple)
                  </span>
                </label>
              </div>

              <div class="divider text-xs">Known Words (from Anki)</div>

              <div class="form-control">
                <label class="label cursor-pointer">
                  <span class="label-text font-medium text-sm">Highlight Known Words</span>
                  <input v-model="localSettings.highlightKnownWords" type="checkbox" class="toggle toggle-success toggle-sm" />
                </label>
                <label class="label">
                  <span class="label-text-alt text-xs">Green background for words you know</span>
                </label>
              </div>

              <div class="form-control">
                <label class="label cursor-pointer">
                  <span class="label-text font-medium text-sm">Dim Known Words</span>
                  <input v-model="localSettings.dimKnownWords" type="checkbox" class="toggle toggle-primary toggle-sm" />
                </label>
                <label class="label">
                  <span class="label-text-alt text-xs">Lower opacity for known words</span>
                </label>
              </div>

              <div class="form-control">
                <label class="label cursor-pointer">
                  <span class="label-text font-medium text-sm">Strikethrough Known Words</span>
                  <input v-model="localSettings.strikethroughKnown" type="checkbox" class="toggle toggle-primary toggle-sm" />
                </label>
                <label class="label">
                  <span class="label-text-alt text-xs">Cross out words you already know</span>
                </label>
              </div>

              <div class="form-control">
                <label class="label cursor-pointer">
                  <span class="label-text font-medium text-sm">Underline Unknown Words</span>
                  <input v-model="localSettings.underlineUnknown" type="checkbox" class="toggle toggle-primary toggle-sm" />
                </label>
              </div>
            </div>

            <div v-show="activeTab === 'grammar'" class="space-y-4">
              <h3 class="text-base font-bold mb-3">Grammar Mode</h3>

              <div class="alert alert-warning text-xs py-2">
                <IconZap class="w-3 h-3" />
                <span>Grammar mode generates visual analysis with arrows and color coding</span>
              </div>

              <div class="form-control">
                <label class="label cursor-pointer">
                  <span class="label-text font-medium text-sm">Enable Grammar Mode</span>
                  <input v-model="localSettings.grammarMode" type="checkbox" class="toggle toggle-accent toggle-sm" />
                </label>
                <label class="label">
                  <span class="label-text-alt text-xs">Show visual grammar breakdown for all sentences</span>
                </label>
              </div>

              <div v-if="localSettings.grammarMode" class="space-y-3 pl-3 border-l-2 border-accent">
                <div class="form-control">
                  <label class="label cursor-pointer">
                    <span class="label-text text-sm">Show Particle Arrows</span>
                    <input v-model="localSettings.grammarShowArrows" type="checkbox" class="toggle toggle-primary toggle-sm" />
                  </label>
                </div>

                <div class="form-control">
                  <label class="label cursor-pointer">
                    <span class="label-text text-sm">Show Grammar Labels</span>
                    <input v-model="localSettings.grammarShowLabels" type="checkbox" class="toggle toggle-primary toggle-sm" />
                  </label>
                </div>

                <div class="form-control">
                  <label class="label cursor-pointer">
                    <span class="label-text text-sm">Show Translation Boxes</span>
                    <input v-model="localSettings.grammarShowTranslation" type="checkbox" class="toggle toggle-primary toggle-sm" />
                  </label>
                </div>

                <div class="divider text-xs my-2">Arrow Styling</div>

                <div class="form-control">
                  <label class="label">
                    <span class="label-text text-sm">Arrow Thickness: {{ localSettings.grammarArrowThickness }}px</span>
                  </label>
                  <input v-model.number="localSettings.grammarArrowThickness" type="range" min="1" max="5" step="0.5" class="range range-accent range-xs" />
                </div>

                <div class="form-control">
                  <label class="label">
                    <span class="label-text text-sm">Arrow Opacity: {{ localSettings.grammarArrowOpacity }}%</span>
                  </label>
                  <input v-model.number="localSettings.grammarArrowOpacity" type="range" min="20" max="100" step="5" class="range range-accent range-xs" />
                </div>

                <div class="divider text-xs my-2">Color Scheme</div>

                <div class="form-control">
                  <label class="label">
                    <span class="label-text text-sm">Subject Color</span>
                  </label>
                  <div class="flex gap-2 items-center">
                    <input v-model="localSettings.grammarSubjectColor" type="color" class="input input-bordered input-sm w-16 h-8" />
                    <span class="text-xs flex-1">Subject/Topic (は)</span>
                  </div>
                </div>

                <div class="form-control">
                  <label class="label">
                    <span class="label-text text-sm">Object Color</span>
                  </label>
                  <div class="flex gap-2 items-center">
                    <input v-model="localSettings.grammarObjectColor" type="color" class="input input-bordered input-sm w-16 h-8" />
                    <span class="text-xs flex-1">Direct Object (を)</span>
                  </div>
                </div>

                <div class="form-control">
                  <label class="label">
                    <span class="label-text text-sm">Particle Color</span>
                  </label>
                  <div class="flex gap-2 items-center">
                    <input v-model="localSettings.grammarParticleColor" type="color" class="input input-bordered input-sm w-16 h-8" />
                    <span class="text-xs flex-1">All Particles</span>
                  </div>
                </div>

                <div class="form-control">
                  <label class="label">
                    <span class="label-text text-sm">Verb Color</span>
                  </label>
                  <div class="flex gap-2 items-center">
                    <input v-model="localSettings.grammarVerbColor" type="color" class="input input-bordered input-sm w-16 h-8" />
                    <span class="text-xs flex-1">Action Verbs</span>
                  </div>
                </div>

                <div class="form-control">
                  <label class="label">
                    <span class="label-text text-sm">Modifier Color</span>
                  </label>
                  <div class="flex gap-2 items-center">
                    <input v-model="localSettings.grammarModifierColor" type="color" class="input input-bordered input-sm w-16 h-8" />
                    <span class="text-xs flex-1">Adjectives & Adverbs</span>
                  </div>
                </div>

                <div class="divider text-xs my-2">Display Options</div>

                <div class="form-control">
                  <label class="label">
                    <span class="label-text text-sm">Label Font Size: {{ localSettings.grammarLabelSize }}px</span>
                  </label>
                  <input v-model.number="localSettings.grammarLabelSize" type="range" min="8" max="16" step="1" class="range range-accent range-xs" />
                </div>

                <div class="form-control">
                  <label class="label">
                    <span class="label-text text-sm">Spacing Between Lines: {{ localSettings.grammarLineSpacing }}px</span>
                  </label>
                  <input v-model.number="localSettings.grammarLineSpacing" type="range" min="20" max="80" step="5" class="range range-accent range-xs" />
                </div>

                <div class="form-control">
                  <label class="label cursor-pointer">
                    <span class="label-text text-sm">Highlight Word on Hover</span>
                    <input v-model="localSettings.grammarHighlightOnHover" type="checkbox" class="toggle toggle-accent toggle-sm" />
                  </label>
                </div>

                <div class="form-control">
                  <label class="label cursor-pointer">
                    <span class="label-text text-sm">Animate Arrows</span>
                    <input v-model="localSettings.grammarAnimateArrows" type="checkbox" class="toggle toggle-accent toggle-sm" />
                  </label>
                </div>

                <div class="form-control">
                  <label class="label cursor-pointer">
                    <span class="label-text text-sm">Show Grammatical Notes</span>
                    <input v-model="localSettings.grammarShowNotes" type="checkbox" class="toggle toggle-accent toggle-sm" />
                  </label>
                </div>

                <button @click="resetGrammarColors" class="btn btn-outline btn-xs w-full mt-2">
                  <IconRotateCcw class="w-3 h-3" />
                  Reset Grammar Colors
                </button>
              </div>
            </div>

            <div v-show="activeTab === 'colors'" class="space-y-4">
              <h3 class="text-base font-bold mb-3">Color Settings</h3>

              <div class="form-control">
                <label class="label">
                  <span class="label-text font-medium text-sm">Text Color</span>
                </label>
                <input v-model="localSettings.textColor" type="color" class="input input-bordered input-sm w-full h-10" />
                <label class="label">
                  <span class="label-text-alt text-xs">Leave empty for theme default</span>
                </label>
              </div>

              <div class="form-control">
                <label class="label">
                  <span class="label-text font-medium text-sm">Background Color</span>
                </label>
                <input v-model="localSettings.backgroundColor" type="color" class="input input-bordered input-sm w-full h-10" />
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
                  <input v-model="localSettings.clickToToggle" type="checkbox" class="toggle toggle-primary toggle-sm" />
                </label>
              </div>

              <div class="form-control">
                <label class="label cursor-pointer">
                  <span class="label-text font-medium text-sm">Show Sentence Numbers</span>
                  <input v-model="localSettings.showSentenceNumbers" type="checkbox" class="toggle toggle-primary toggle-sm" />
                </label>
              </div>

              <div class="form-control">
                <label class="label cursor-pointer">
                  <span class="label-text font-medium text-sm">Auto Scroll</span>
                  <input v-model="localSettings.autoScroll" type="checkbox" class="toggle toggle-primary toggle-sm" />
                </label>
              </div>

              <div class="form-control">
                <label class="label">
                  <span class="label-text font-medium text-sm">Focus Mode Opacity: {{ localSettings.focusModeOpacity }}%</span>
                </label>
                <input v-model.number="localSettings.focusModeOpacity" type="range" min="10" max="80" step="5" class="range range-primary range-xs" />
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
      <button @click="handleSave" class="btn btn-primary btn-sm">
        <IconCheck class="w-4 h-4" />
        Save
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
import IconZap from '~icons/lucide/zap'
import IconGitBranch from '~icons/lucide/git-branch'

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
  { id: 'grammar', label: 'Grammar Mode', icon: IconGitBranch },
  { id: 'colors', label: 'Colors', icon: IconPalette },
  { id: 'behavior', label: 'Behavior', icon: IconSettings }
]

const defaultGrammarColors = {
  grammarSubjectColor: '#EF4444',
  grammarObjectColor: '#3B82F6',
  grammarParticleColor: '#F59E0B',
  grammarVerbColor: '#10B981',
  grammarModifierColor: '#8B5CF6'
}

const resetGrammarColors = () => {
  Object.assign(localSettings.value, defaultGrammarColors)
}

const handleSave = () => {
  emit('update:settings', { ...localSettings.value })
  emit('update:modelValue', false)
}

const handleReset = () => {
  emit('reset')
  emit('update:modelValue', false)
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