<template>
  <div v-if="modelValue" class="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-2 sm:p-4" @click.self="closeModal">
    <!-- Fixed Size Modal - Wider for long sentences -->
    <div class="bg-base-100 rounded-2xl shadow-2xl w-full max-w-7xl h-[90vh] overflow-hidden flex flex-col border border-base-300">
      <!-- Header -->
      <div class="p-5 border-b border-base-300 flex items-center justify-between flex-shrink-0 bg-gradient-to-r from-primary/5 to-secondary/5">
        <div class="flex-1">
          <h2 class="text-xl font-bold flex items-center gap-2">
            <IconSparkles class="w-5 h-5 text-primary" />
            Grammar Analysis
          </h2>
        </div>
        <button @click="closeModal" class="btn btn-ghost btn-sm btn-circle hover:bg-base-200">
          <IconX class="w-5 h-5" />
        </button>
      </div>

      <!-- Content Area - Fixed Height -->
      <div class="flex-1 overflow-hidden flex flex-col min-h-0">
        <!-- Loading State -->
        <div v-if="isLoading" class="flex-1 flex items-center justify-center">
          <div class="text-center">
            <div class="loading loading-spinner loading-lg text-primary mb-4"></div>
            <p class="text-base-content/60 font-medium">Analyzing sentence structure...</p>
          </div>
        </div>

        <!-- Analysis Content -->
        <div v-else-if="analysis" class="flex-1 overflow-y-auto custom-scrollbar p-3 sm:p-4 lg:p-5">
          <div class="space-y-4">
            <!-- Translation - Prominent at Top -->
            <div v-if="analysis.translation" class="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-xl p-3 sm:p-4 border border-primary/20">
              <div class="flex items-start gap-2 sm:gap-3">
                <IconLanguages class="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0 mt-0.5" />
                <div class="flex-1 min-w-0">
                  <div class="text-xs font-semibold text-base-content/60 uppercase tracking-wide mb-1">Translation</div>
                  <p class="text-base sm:text-lg text-base-content font-medium leading-relaxed break-words">{{ analysis.translation }}</p>
                </div>
                <button
                  @click="copyToClipboard(analysis.translation)"
                  class="btn btn-xs btn-ghost flex-shrink-0"
                  title="Copy translation"
                >
                  <IconCopy class="w-3 h-3 sm:w-4 sm:h-4" />
                </button>
              </div>
            </div>

            <!-- Visual Sentence Structure Flow -->
            <div class="bg-gradient-to-br from-base-200 to-base-100 rounded-xl p-4 sm:p-5 border border-base-300 shadow-sm">
              <div class="flex items-center gap-2 mb-3">
                <IconGitBranch class="w-5 h-5 text-accent" />
                <h3 class="text-base font-bold">Sentence Structure</h3>
                <span class="text-xs text-base-content/50 ml-auto">({{ analysis.coloredWords.length }} words)</span>
              </div>
              
              <!-- Linear Flow Visualization -->
              <div class="space-y-4">
                <!-- Word Flow Row - Horizontal Scrollable for Long Sentences -->
                <div class="bg-base-100 rounded-lg border border-base-300 p-3 overflow-x-auto custom-scrollbar">
                  <div class="flex items-start gap-x-2 gap-y-3 min-w-max">
                    <template v-for="(word, idx) in analysis.coloredWords" :key="idx">
                      <!-- Word Card - Compact Design -->
                      <div class="relative flex flex-col items-center group flex-shrink-0" style="width: 85px; min-height: 85px;">
                        <div
                          class="text-xl font-bold px-2 py-1.5 rounded-md border-2 transition-all group-hover:scale-105 flex-shrink-0 shadow-sm"
                          :style="{
                            color: word.color,
                            borderColor: word.color,
                            backgroundColor: word.color + '15'
                          }"
                        >
                          {{ word.word }}
                        </div>
                        <div class="text-[10px] text-base-content/50 mt-0.5 font-medium flex-shrink-0 leading-tight">{{ word.reading }}</div>
                        <div class="text-[10px] text-base-content/70 text-center mt-0.5 leading-tight font-medium flex-1 flex items-center justify-center px-1" style="min-height: 28px;">
                          {{ getRelevantMeaning(word) }}
                        </div>
                      </div>

                      <!-- Connection Arrow - Compact -->
                      <div v-if="idx < analysis.coloredWords.length - 1" class="flex items-center self-start flex-shrink-0" style="padding-top: 28px;">
                        <svg width="20" height="16" class="opacity-40">
                          <line x1="2" y1="8" x2="18" y2="8" stroke="currentColor" stroke-width="1.5" />
                          <polygon points="18,8 14,5 14,11" fill="currentColor" />
                        </svg>
                      </div>
                    </template>
                  </div>
                </div>

                <!-- Reading Order Guide - Scrollable if long -->
                <div v-if="readingOrder.length > 0" class="bg-gradient-to-r from-accent/10 to-primary/10 rounded-lg p-3 border border-accent/20 shadow-sm">
                  <div class="flex items-center gap-2 mb-2">
                    <IconArrowRight class="w-4 h-4 text-accent" />
                    <h4 class="text-sm font-bold">Reading Order</h4>
                  </div>
                  <div class="max-h-32 overflow-y-auto custom-scrollbar space-y-1.5">
                    <div v-for="(step, idx) in readingOrder" :key="idx" class="text-xs text-base-content/80 leading-relaxed flex items-start gap-2 bg-base-100/50 rounded px-2 py-1 border border-base-300/50">
                      <span class="text-accent font-bold flex-shrink-0 min-w-[18px]">{{ idx + 1 }}.</span>
                      <span class="flex-1">{{ step }}</span>
                    </div>
                  </div>
                </div>

                <!-- Particle Connections - Compact Design -->
                <div v-if="analysis.connections?.length" class="space-y-2">
                  <div class="text-xs font-semibold text-base-content/60 uppercase tracking-wide mb-2">Particle Breakdown</div>
                  <div class="max-h-64 overflow-y-auto custom-scrollbar space-y-2">
                    <div
                      v-for="(conn, idx) in analysis.connections"
                      :key="idx"
                      class="flex items-center gap-2 bg-base-100 rounded-lg p-2.5 border border-base-300 hover:border-accent/50 transition-all"
                    >
                      <div class="flex items-center gap-2 flex-1 min-w-0">
                        <span class="text-xs font-bold px-2 py-1 rounded shadow-sm whitespace-nowrap" :style="{ color: conn.fromColor, backgroundColor: conn.fromColor + '20', border: `1px solid ${conn.fromColor}40` }">
                          {{ conn.from }}
                        </span>
                        <div class="flex flex-col items-center gap-0.5">
                          <div class="text-[10px] text-base-content/50">{{ conn.particleReading }}</div>
                          <div class="text-base font-bold px-2 py-1 rounded-full shadow-sm" :style="{ color: conn.particleColor, backgroundColor: conn.particleColor + '25', border: `1.5px solid ${conn.particleColor}` }">
                            {{ conn.particle }}
                          </div>
                        </div>
                        <span class="text-xs font-bold px-2 py-1 rounded shadow-sm whitespace-nowrap" :style="{ color: conn.toColor, backgroundColor: conn.toColor + '20', border: `1px solid ${conn.toColor}40` }">
                          {{ conn.to }}
                        </span>
                      </div>
                      <div class="flex flex-col items-end flex-shrink-0 gap-1 ml-2">
                        <div class="badge badge-xs font-semibold" :style="{ backgroundColor: conn.particleColor + '20', color: conn.particleColor, border: 'none' }">
                          {{ conn.role }}
                        </div>
                        <div class="text-[10px] text-base-content/60 text-right max-w-[200px] leading-relaxed">
                          {{ conn.explanation }}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Main Verb - Highlighted -->
            <div v-if="analysis.verb" class="bg-gradient-to-r from-success/10 to-success/5 rounded-xl p-3 sm:p-4 border-2 border-success/30">
              <div class="flex items-center justify-between gap-3 flex-wrap">
                <div class="flex items-center gap-2 sm:gap-3">
                  <IconZap class="w-4 h-4 sm:w-5 sm:h-5 text-success flex-shrink-0" />
                  <div>
                    <div class="text-xs font-semibold text-success uppercase tracking-wide mb-1">Main Verb</div>
                    <div class="text-xl sm:text-2xl font-bold" :style="{ color: COLORS.verb }">
                      {{ analysis.verb.word }}
                      <span class="text-xs sm:text-sm font-normal text-base-content/60 ml-2">({{ analysis.verb.reading }})</span>
                    </div>
                  </div>
                </div>
                <div class="text-sm sm:text-base text-base-content/80 font-medium break-words">{{ analysis.verb.meaning }}</div>
              </div>
            </div>

            <!-- Story References -->
            <div v-if="analysis.references?.length" class="bg-base-200 rounded-xl p-4 border border-base-300">
              <div class="flex items-center gap-2 mb-3">
                <IconLink class="w-4 h-4 text-secondary" />
                <h3 class="text-sm font-bold">References</h3>
              </div>
              <div class="flex flex-wrap gap-2">
                <div
                  v-for="(ref, idx) in analysis.references"
                  :key="idx"
                  class="badge badge-secondary badge-sm gap-1"
                >
                  <span class="text-xs opacity-70">{{ ref.type }}:</span>
                  <span>{{ ref.element }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Error State -->
        <div v-else class="flex-1 flex items-center justify-center p-12">
          <div class="text-center">
            <IconAlertCircle class="w-12 h-12 text-error mx-auto mb-4 opacity-50" />
            <p class="text-base-content/60">No analysis available</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import IconX from '~icons/lucide/x'
import IconSparkles from '~icons/lucide/sparkles'
import IconMessageSquare from '~icons/lucide/message-square'
import IconGitBranch from '~icons/lucide/git-branch'
import IconLink from '~icons/lucide/link'
import IconZap from '~icons/lucide/zap'
import IconLanguages from '~icons/lucide/languages'
import IconCopy from '~icons/lucide/copy'
import IconAlertCircle from '~icons/lucide/alert-circle'
import IconArrowRight from '~icons/lucide/arrow-right'

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
const analysis = ref<any>(null)

const COLORS = {
  subject: '#EF4444',
  particle: '#F59E0B',
  object: '#3B82F6',
  verb: '#10B981',
  adjective: '#8B5CF6',
  other: '#6B7280'
}

const readingOrder = computed(() => {
  if (!analysis.value) return []
  return generateReadingOrder(analysis.value)
})

const closeModal = () => {
  emit('update:modelValue', false)
}

const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text)
  } catch (error) {
    console.error('Failed to copy:', error)
  }
}

const formatPos = (pos: string): string => {
  const mapping: Record<string, string> = {
    noun: 'Noun',
    verb: 'Verb',
    adjective: 'Adjective',
    particle: 'Particle',
    adverb: 'Adverb',
    prefix: 'Prefix',
    suffix: 'Suffix',
    conjunction: 'Conjunction',
    interjection: 'Interjection'
  }
  return mapping[pos?.toLowerCase()] || pos || 'Other'
}

// Truncate meaning to first/shortest relevant meaning
const truncateMeaning = (meaning: string, maxLength: number = 30): string => {
  if (!meaning) return ''
  
  // Split by common delimiters and take first meaning
  const meanings = meaning.split(/[,;]/).map(m => m.trim()).filter(Boolean)
  if (meanings.length === 0) return meaning
  
  // Take shortest meaningful option (but at least first one)
  let best = meanings[0] || ''
  for (const m of meanings) {
    if (m.length < best.length && m.length > 0) {
      best = m
    }
  }
  
  // If still too long, truncate
  if (best.length > maxLength) {
    return best.substring(0, maxLength) + '...'
  }
  
  return best
}

// Get relevant meaning for word - shorter for compact cards
const getRelevantMeaning = (word: any): string => {
  if (!word.meaning) return formatPos(word.pos)
  return truncateMeaning(word.meaning, 20)
}

// Generate reading order explanation
const generateReadingOrder = (analysis: any): string[] => {
  if (!analysis?.coloredWords || !analysis?.connections) return []
  
  const steps: string[] = []
  const connections = analysis.connections || []
  
  // Group connections by order
  const sortedConnections = [...connections].sort((a: any, b: any) => (a.order || 0) - (b.order || 0))
  
  // Start with subject/topic if exists
  const topicConn = sortedConnections.find((c: any) => c.particle === 'は' || c.particle === 'が')
  if (topicConn) {
    steps.push(`"${topicConn.from}" ${topicConn.particle} → ${topicConn.role}`)
  }
  
  // Add other connections in order
  sortedConnections.forEach((conn: any) => {
    if (conn.particle !== 'は' && conn.particle !== 'が') {
      steps.push(`"${conn.from}" ${conn.particle} → "${conn.to}" (${conn.role})`)
    }
  })
  
  // End with verb
  if (analysis.verb) {
    steps.push(`Main verb: "${analysis.verb.word}" (${analysis.verb.reading})`)
  }
  
  return steps
}

// Check if text contains Japanese characters
const containsJapanese = (text: string): boolean => {
  if (!text) return false
  return /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(text)
}

const analyzeCurrentSentence = async () => {
  if (!props.sentence) return

  isLoading.value = true
  analysis.value = null

  try {
    const result = await analyzeSentence(props.sentence)
    
    // Filter out Japanese story context or translate it
    if (result.storyContext && containsJapanese(result.storyContext)) {
      // If story context is in Japanese, remove it as it's not helpful
      result.storyContext = ''
    }
    
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

watch(() => props.sentence, () => {
  if (props.modelValue && props.sentence) {
    analyzeCurrentSentence()
  }
})
</script>
