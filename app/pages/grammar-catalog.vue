<template>
  <div class="w-full h-full overflow-y-auto bg-base-200">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">

      <!-- Simplified Stats Cards -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div class="card bg-base-100 shadow-sm hover:shadow-md transition-shadow">
          <div class="card-body p-4 text-center">
            <div class="flex items-center justify-center w-10 h-10 mx-auto mb-2 rounded-full bg-primary/10">
              <IconTarget class="w-5 h-5 text-primary" />
            </div>
            <div class="text-2xl font-bold text-primary">{{ overallProficiency }}%</div>
            <div class="text-xs text-base-content/60">Overall</div>
          </div>
        </div>
        
        <div class="card bg-base-100 shadow-sm hover:shadow-md transition-shadow">
          <div class="card-body p-4 text-center">
            <div class="flex items-center justify-center w-10 h-10 mx-auto mb-2 rounded-full bg-secondary/10">
              <IconBookOpen class="w-5 h-5 text-secondary" />
            </div>
            <div class="text-2xl font-bold text-secondary">{{ grammarPoints.length }}</div>
            <div class="text-xs text-base-content/60">Total</div>
          </div>
        </div>
        
        <div class="card bg-base-100 shadow-sm hover:shadow-md transition-shadow">
          <div class="card-body p-4 text-center">
            <div class="flex items-center justify-center w-10 h-10 mx-auto mb-2 rounded-full bg-success/10">
              <IconCheck class="w-5 h-5 text-success" />
            </div>
            <div class="text-2xl font-bold text-success">{{ masteredCount }}</div>
            <div class="text-xs text-base-content/60">Mastered</div>
          </div>
        </div>
        
        <div class="card bg-base-100 shadow-sm hover:shadow-md transition-shadow">
          <div class="card-body p-4 text-center">
            <div class="flex items-center justify-center w-10 h-10 mx-auto mb-2 rounded-full bg-warning/10">
              <IconTrendingUp class="w-5 h-5 text-warning" />
            </div>
            <div class="text-2xl font-bold text-warning">{{ inProgressCount }}</div>
            <div class="text-xs text-base-content/60">Learning</div>
          </div>
        </div>
      </div>

      <!-- Enhanced Search and Filter Card -->
      <div class="card bg-base-100 shadow-md">
        <div class="card-body p-4 sm:p-6">
          <div class="flex flex-col gap-3">
            <!-- Search Bar -->
            <div class="relative">
              <IconSearch class="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" />
              <input 
                v-model="searchQuery" 
                type="text" 
                placeholder="Search grammar points, English..." 
                class="input input-bordered w-full pl-10 pr-4"
              />
            </div>
            
            <!-- Filter Row -->
            <div class="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
              <div class="flex-1 flex gap-2">
                <select v-model="selectedLevel" class="select select-bordered flex-1 sm:flex-none sm:w-32">
                  <option value="">All Levels</option>
                  <option v-for="level in levels" :key="level" :value="level">{{ level }}</option>
                </select>
                
                <button 
                  @click="resetFilters" 
                  class="btn btn-ghost gap-2"
                  :class="{ 'btn-disabled': !searchQuery && !selectedLevel }"
                >
                  <IconRefreshCw class="w-4 h-4" />
                  <span class="hidden sm:inline">Clear</span>
                </button>
              </div>
              
              <div class="text-sm text-base-content/60 text-center sm:text-right">
                {{ filteredPoints.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1 }}–{{ Math.min(currentPage * itemsPerPage, filteredPoints.length) }} of {{ filteredPoints.length }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="filteredPoints.length === 0" class="card bg-base-100 shadow-sm border border-base-300">
        <div class="card-body py-16 text-center">
          <IconSearch class="w-16 h-16 mx-auto mb-4 text-base-content/20" />
          <h3 class="text-lg font-semibold text-base-content/60">No grammar points found</h3>
          <p class="text-sm text-base-content/40">Try adjusting your search or filters</p>
        </div>
      </div>

      <!-- Grammar Points Grid -->
      <div v-else>
        <!-- Desktop Grid -->
        <div class="hidden sm:grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
          <GrammarPointCard
            v-for="point in paginatedPoints"
            :key="point.grammarPoint"
            :point="point"
            variant="desktop"
            @open-modal="openScoreModal"
            @reset-score="resetPointScore"
          />
        </div>

        <!-- Mobile List -->
        <div class="sm:hidden space-y-2">
          <GrammarPointCard
            v-for="point in paginatedPoints"
            :key="point.grammarPoint"
            :point="point"
            variant="mobile"
            @open-modal="openScoreModal"
            @reset-score="resetPointScore"
          />
        </div>
      </div>

      <!-- Pagination and Actions -->
      <div v-if="filteredPoints.length > 0" class="card bg-base-100 shadow-md">
        <div class="card-body p-4">
          <div class="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div class="text-sm text-base-content/70 order-2 sm:order-1">
              Page {{ currentPage }} of {{ totalPages }}
            </div>
            
            <div class="join order-1 sm:order-2">
              <button 
                class="join-item btn btn-sm" 
                :disabled="currentPage === 1" 
                @click="currentPage--"
              >
                <IconChevronLeft class="w-4 h-4" />
              </button>
              <button class="join-item btn btn-sm no-animation">
                {{ currentPage }}
              </button>
              <button 
                class="join-item btn btn-sm" 
                :disabled="currentPage === totalPages" 
                @click="currentPage++"
              >
                <IconChevronRight class="w-4 h-4" />
              </button>
            </div>
            
            <button 
              @click="resetAllScores" 
              class="btn btn-outline btn-error btn-sm gap-2 order-3"
            >
              <IconTrash class="w-4 h-4" />
              <span class="hidden sm:inline">Reset All</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Score Modal -->
    <GrammarScoreModal
      v-model="showScoreModal"
      :point="selectedPoint"
      @save="saveScore"
    />
  </div>
</template>

<script setup lang="ts">
import IconBookOpen from '~icons/lucide/book-open'
import IconSearch from '~icons/lucide/search'
import IconRefreshCw from '~icons/lucide/refresh-cw'
import IconTrash from '~icons/lucide/trash-2'
import IconTarget from '~icons/lucide/target'
import IconCheck from '~icons/lucide/check'
import IconTrendingUp from '~icons/lucide/trending-up'
import IconChevronLeft from '~icons/lucide/chevron-left'
import IconChevronRight from '~icons/lucide/chevron-right'

import GrammarPointCard from '~/components/grammar/GrammarPointCard.vue'
import GrammarScoreModal from '~/components/grammar/GrammarScoreModal.vue'

interface GrammarPoint {
  grammarPoint: string
  english: string
  level: string
  userScore?: number
}

definePageMeta({ layout: 'default' })

const { grammarPoints, loadGrammarPoints, updateScore, getProficiencyForLevel, getGrammarByLevel, resetScores } = useGrammarCatalog()

const searchQuery = ref('')
const selectedLevel = ref('')
const currentPage = ref(1)
const itemsPerPage = 16
const levels = ['N5', 'N4', 'N3', 'N2', 'N1'] as const
const showScoreModal = ref(false)
const selectedPoint = ref<GrammarPoint | null>(null)

const filteredPoints = computed(() => {
  let filtered = grammarPoints.value as GrammarPoint[]
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase()
    filtered = filtered.filter(p =>
      [p.grammarPoint, p.english].some(v => v.toLowerCase().includes(q))
    )
  }
  if (selectedLevel.value) filtered = filtered.filter(p => p.level === selectedLevel.value)
  return filtered.sort((a, b) => (b.userScore ?? 0) - (a.userScore ?? 0))
})

const totalPages = computed(() => Math.ceil(filteredPoints.value.length / itemsPerPage))
const paginatedPoints = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  return filteredPoints.value.slice(start, start + itemsPerPage)
})

const overallProficiency = computed(() => {
  const avg = grammarPoints.value.length
    ? grammarPoints.value.reduce((sum, p) => sum + (p.userScore ?? 0), 0) / grammarPoints.value.length
    : 0
  return Math.round(avg)
})

const masteredCount = computed(() => grammarPoints.value.filter(p => (p.userScore ?? 0) >= 80).length)

const inProgressCount = computed(() => grammarPoints.value.filter(p => {
  const score = p.userScore ?? 0
  return score > 0 && score < 80
}).length)

const resetFilters = () => {
  searchQuery.value = ''
  selectedLevel.value = ''
  currentPage.value = 1
}

const openScoreModal = (point: GrammarPoint) => {
  selectedPoint.value = point
  showScoreModal.value = true
}

const saveScore = (score: number) => {
  if (selectedPoint.value) {
    selectedPoint.value.userScore = score
    updateScore(selectedPoint.value.grammarPoint, score)
  }
}

const resetPointScore = (grammarPoint: string) => {
  const p = grammarPoints.value.find((x: GrammarPoint) => x.grammarPoint === grammarPoint)
  if (p) {
    p.userScore = 0
    updateScore(grammarPoint, 0)
  }
}

const resetAllScores = () => {
  if (confirm('Are you sure you want to reset all grammar scores? This cannot be undone.')) {
    resetScores()
  }
}

watch([searchQuery, selectedLevel], () => {
  currentPage.value = 1
})

onMounted(async () => {
  await loadGrammarPoints()
})
</script>