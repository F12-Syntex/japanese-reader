<template>
  <div v-if="modelValue" class="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4" @click.self="closeModal">
    <div class="bg-base-100 rounded-lg shadow-xl w-full max-w-7xl max-h-[95vh] overflow-hidden flex flex-col">
      <div class="p-4 sm:p-6 border-b border-base-300 flex items-center justify-between flex-shrink-0">
        <div class="flex-1">
          <h2 class="text-xl sm:text-2xl font-bold">Grammar Analysis</h2>
          <p class="text-sm text-base-content/60 mt-1">Sentence structure breakdown</p>
        </div>
        <button @click="closeModal" class="btn btn-ghost btn-sm btn-circle">
          <IconX class="w-5 h-5" />
        </button>
      </div>

      <div ref="exportContent" class="flex-1 overflow-y-auto custom-scrollbar">
        <div v-if="isLoading" class="flex items-center justify-center py-12">
          <div class="text-center">
            <div class="loading loading-spinner loading-lg mb-4"></div>
            <p class="text-base-content/60">Analyzing sentence structure...</p>
          </div>
        </div>

        <div v-else-if="analysis" class="p-4 sm:p-6 space-y-6">
          <div class="bg-base-200 rounded-2xl p-6">
            <h3 class="text-lg font-bold mb-4 flex items-center gap-2">
              <IconMessageSquare class="w-5 h-5 text-primary" />
              Sentence Breakdown
            </h3>
            <div class="bg-base-100 rounded-xl p-6">
              <div class="flex flex-wrap items-start gap-4 mb-6">
                <div 
                  v-for="(word, idx) in analysis.coloredWords" 
                  :key="idx"
                  class="flex flex-col items-center gap-1"
                >
                  <div class="text-xs opacity-60 min-h-[16px]">{{ word.reading }}</div>
                  <div 
                    class="text-2xl font-bold px-3 py-1 rounded transition-all hover:scale-105"
                    :style="{ color: word.color }"
                  >
                    {{ word.word }}
                  </div>
                  <div class="text-xs opacity-70 text-center max-w-[100px]">{{ word.meaning }}</div>
                  <div class="badge badge-xs opacity-50">{{ word.pos }}</div>
                </div>
              </div>
              <div class="text-lg text-base-content/80 border-t border-base-300 pt-4">
                {{ analysis.translation }}
              </div>
            </div>
          </div>

          <div v-if="analysis.storyContext" class="bg-gradient-to-br from-primary/10 to-secondary/10 rounded-2xl p-6 border border-primary/20">
            <div class="flex items-start gap-3">
              <IconBookOpen class="w-6 h-6 text-primary flex-shrink-0 mt-1" />
              <div class="flex-1">
                <h3 class="text-lg font-bold mb-2">Story Context</h3>
                <p class="text-base-content/80 leading-relaxed">{{ analysis.storyContext }}</p>
              </div>
            </div>
          </div>

          <div v-if="analysis.connections?.length" class="bg-base-200 rounded-2xl p-6">
            <h3 class="text-lg font-bold mb-6 flex items-center gap-2">
              <IconGitBranch class="w-5 h-5 text-accent" />
              Particle Connections
            </h3>
            <div class="space-y-6">
              <div 
                v-for="(connection, idx) in analysis.connections" 
                :key="idx"
                class="bg-base-100 rounded-xl p-6 border border-base-300"
              >
                <div class="flex items-center gap-2 mb-4">
                  <div class="badge badge-primary">Step {{ idx + 1 }}</div>
                </div>

                <div class="mb-4 text-sm text-base-content/60 text-center font-mono">
                  <span class="opacity-40">{{ connection.contextBefore }}</span>
                  <span 
                    class="font-bold px-1"
                    :style="{ color: connection.fromColor }"
                  >{{ connection.from }}</span>
                  <span 
                    class="font-bold px-1"
                    :style="{ color: connection.particleColor }"
                  >{{ connection.particle }}</span>
                  <span 
                    class="font-bold px-1"
                    :style="{ color: connection.toColor }"
                  >{{ connection.to }}</span>
                  <span class="opacity-40">{{ connection.contextAfter }}</span>
                </div>

                <div class="flex items-center justify-center gap-6 mb-4">
                  <div class="flex flex-col items-center gap-1">
                    <div class="text-xs opacity-60">{{ connection.fromReading }}</div>
                    <div 
                      class="text-2xl font-bold px-4 py-2 rounded-lg border-2"
                      :style="{ 
                        color: connection.fromColor,
                        borderColor: connection.fromColor
                      }"
                    >
                      {{ connection.from }}
                    </div>
                  </div>

                  <div class="flex flex-col items-center gap-2">
                    <div class="text-xs opacity-60">{{ connection.particleReading }}</div>
                    <div class="relative">
                      <svg width="80" height="60" class="absolute -left-10 top-1/2 -translate-y-1/2">
                        <defs>
                          <marker
                            :id="`arrow-start-${idx}`"
                            markerWidth="8"
                            markerHeight="8"
                            refX="0"
                            refY="4"
                            orient="auto"
                          >
                            <path d="M8,0 L8,8 L0,4 Z" :fill="connection.particleColor" />
                          </marker>
                          <marker
                            :id="`arrow-end-${idx}`"
                            markerWidth="8"
                            markerHeight="8"
                            refX="8"
                            refY="4"
                            orient="auto"
                          >
                            <path d="M0,0 L8,4 L0,8 Z" :fill="connection.particleColor" />
                          </marker>
                        </defs>
                        <line
                          x1="10" y1="30"
                          x2="35" y2="30"
                          :stroke="connection.particleColor"
                          stroke-width="2.5"
                          :marker-start="`url(#arrow-start-${idx})`"
                        />
                      </svg>
                      <div 
                        class="text-xl font-bold px-4 py-2 rounded-full relative z-10"
                        :style="{ 
                          color: connection.particleColor,
                          border: `2px solid ${connection.particleColor}`,
                          backgroundColor: 'oklch(var(--b1))'
                        }"
                      >
                        {{ connection.particle }}
                      </div>
                      <svg width="80" height="60" class="absolute -right-10 top-1/2 -translate-y-1/2">
                        <line
                          x1="45" y1="30"
                          x2="70" y2="30"
                          :stroke="connection.particleColor"
                          stroke-width="2.5"
                          :marker-end="`url(#arrow-end-${idx})`"
                        />
                      </svg>
                    </div>
                    <div class="badge badge-sm" :style="{ backgroundColor: connection.particleColor + '30', color: connection.particleColor, border: 'none' }">
                      {{ connection.role }}
                    </div>
                  </div>

                  <div class="flex flex-col items-center gap-1">
                    <div class="text-xs opacity-60">{{ connection.toReading }}</div>
                    <div 
                      class="text-2xl font-bold px-4 py-2 rounded-lg border-2"
                      :style="{ 
                        color: connection.toColor,
                        borderColor: connection.toColor
                      }"
                    >
                      {{ connection.to }}
                    </div>
                  </div>
                </div>

                <div class="text-center text-sm text-base-content/70 bg-base-200 rounded-lg px-4 py-3 border border-base-300">
                  {{ connection.explanation }}
                </div>
              </div>

              <div v-if="analysis.verb" class="border-t-2 border-dashed border-base-300 pt-6">
                <div class="flex flex-col items-center gap-4">
                  <div class="flex items-center gap-3">
                    <div class="text-sm font-medium opacity-70">MAIN ACTION</div>
                    <IconArrowDown class="w-5 h-5 opacity-50" />
                  </div>
                  <div class="flex flex-col items-center gap-2">
                    <div class="text-xs opacity-60">{{ analysis.verb.reading }}</div>
                    <div 
                      class="text-3xl font-bold px-8 py-4 rounded-xl border-3"
                      :style="{ 
                        color: COLORS.verb,
                        borderColor: COLORS.verb,
                        borderWidth: '3px'
                      }"
                    >
                      {{ analysis.verb.word }}
                    </div>
                    <div class="text-lg font-medium opacity-80">{{ analysis.verb.meaning }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div v-if="analysis.references?.length" class="bg-base-200 rounded-2xl p-6">
            <h3 class="text-lg font-bold mb-4 flex items-center gap-2">
              <IconLink class="w-5 h-5 text-secondary" />
              Story References
            </h3>
            <div class="space-y-2">
              <div 
                v-for="(ref, idx) in analysis.references" 
                :key="idx"
                class="bg-base-100 rounded-xl p-3 hover:bg-base-300 transition-colors"
              >
                <div class="flex items-start gap-2">
                  <div class="badge badge-secondary badge-sm flex-shrink-0 mt-1">{{ ref.type }}</div>
                  <div class="flex-1 min-w-0">
                    <div class="font-bold text-sm">{{ ref.element }}</div>
                    <div class="text-xs text-base-content/60">{{ ref.explanation }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="bg-base-200 rounded-2xl p-4">
            <div class="flex items-center gap-2 mb-3">
              <IconPalette class="w-4 h-4" />
              <h3 class="font-bold text-sm">Color Legend</h3>
            </div>
            <div class="flex flex-wrap gap-3">
              <div v-for="item in colorLegend" :key="item.label" class="flex items-center gap-2">
                <div class="w-6 h-6 rounded-full border-2" :style="{ borderColor: item.color }"></div>
                <span class="text-xs font-medium">{{ item.label }}</span>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="text-center py-12 text-base-content/50">
          No analysis available
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import IconX from '~icons/lucide/x'
import IconArrowDown from '~icons/lucide/arrow-down'
import IconPalette from '~icons/lucide/palette'
import IconMessageSquare from '~icons/lucide/message-square'
import IconGitBranch from '~icons/lucide/git-branch'
import IconBookOpen from '~icons/lucide/book-open'
import IconLink from '~icons/lucide/link'

const props = defineProps({
  modelValue: Boolean,
  sentence: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['update:modelValue'])

const { analyzeSentence } = useSentenceAnalysis()

const isLoading = ref(false)
const analysis = ref(null)
const exportContent = ref(null)

const COLORS = {
  subject: '#EF4444',
  particle: '#F59E0B',
  object: '#3B82F6',
  verb: '#10B981',
  adjective: '#8B5CF6',
  other: '#6B7280'
}

const colorLegend = [
  { label: 'Noun', color: COLORS.subject },
  { label: 'Particle', color: COLORS.particle },
  { label: 'Verb', color: COLORS.verb },
  { label: 'Adjective', color: COLORS.adjective }
]

const closeModal = () => {
  emit('update:modelValue', false)
}

const analyzeCurrentSentence = async () => {
  if (!props.sentence) return

  isLoading.value = true
  analysis.value = null

  try {
    const result = await analyzeSentence(props.sentence)
    analysis.value = result
  } catch (error) {
    console.error('Analysis error:', error)
  } finally {
    isLoading.value = false
  }
}

watch(() => props.modelValue, (newVal) => {
  if (newVal && props.sentence) {
    analyzeCurrentSentence()
  }
})
</script>