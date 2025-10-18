<template>
  <div class="w-full h-full overflow-y-auto custom-scrollbar bg-base-200">
    <div class="px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <!-- Quick Stats Bar -->
      <div class="flex flex-wrap gap-3">
        <div class="flex items-center gap-2 px-4 py-2 bg-base-100 rounded-lg shadow-sm">
          <div class="text-2xl font-bold text-primary">{{ overallProficiency }}%</div>
          <div class="text-xs text-base-content/60">Overall</div>
        </div>
        <div class="flex items-center gap-2 px-4 py-2 bg-base-100 rounded-lg shadow-sm">
          <div class="text-2xl font-bold text-base-content">{{ grammarPoints.length }}</div>
          <div class="text-xs text-base-content/60">Total Points</div>
        </div>
        <div class="flex items-center gap-2 px-4 py-2 bg-base-100 rounded-lg shadow-sm">
          <div class="text-2xl font-bold text-success">{{ masteredCount }}</div>
          <div class="text-xs text-base-content/60">Mastered</div>
        </div>
        <div v-for="summary in levelsSummary" :key="summary.level" class="flex items-center gap-2 px-3 py-2 bg-base-100 rounded-lg shadow-sm">
          <div class="badge badge-sm" :class="getLevelBadgeClass(summary.level)">{{ summary.level }}</div>
          <div class="text-sm font-semibold">{{ summary.proficiency }}%</div>
        </div>
      </div>

      <!-- Search and Filter -->
      <div class="bg-base-100 rounded-xl shadow-sm p-4">
        <div class="flex flex-col sm:flex-row gap-3">
          <div class="relative flex-1">
            <IconSearch class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" />
            <input
              v-model="searchQuery"
              placeholder="Search grammar points..."
              class="input input-bordered w-full pl-10"
            />
          </div>
          <select v-model="selectedLevel" class="select select-bordered w-full sm:w-40">
            <option value="">All Levels</option>
            <option v-for="level in levels" :key="level" :value="level">{{ level }}</option>
          </select>
          <button @click="resetFilters" class="btn btn-ghost gap-2">
            <IconRefreshCw class="w-4 h-4" />
            Clear
          </button>
        </div>
      </div>

      <!-- Results Count -->
      <div class="text-sm text-base-content/60">
        Showing {{ filteredPoints.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1 }}–{{ Math.min(currentPage * itemsPerPage, filteredPoints.length) }} of {{ filteredPoints.length }} points
      </div>

      <!-- Grammar Points Grid -->
      <div v-if="filteredPoints.length === 0" class="bg-base-100 rounded-xl shadow-sm p-12 text-center">
        <IconSearch class="w-12 h-12 mx-auto mb-3 text-base-content/20" />
        <p class="text-base-content/60">No grammar points found</p>
      </div>

      <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3">
        <div
          v-for="point in paginatedPoints"
          :key="point.grammarPoint"
          class="bg-base-100 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between py-3 px-3 h-20"
          :class="getCardBgClass(point.level)"
        >
          <div class="flex items-start justify-between">
            <div class="flex items-center gap-3 flex-1 min-w-0">
              <div class="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <IconBookOpen class="w-4 h-4 text-primary" />
              </div>
              <div class="min-w-0 flex-1">
                <h3 class="font-bold text-sm text-base-content truncate">{{ point.grammarPoint }}</h3>
                <p class="text-xs text-base-content/70 truncate mt-0.5">{{ point.english }}</p>
              </div>
            </div>
            <span class="badge badge-xs self-start ml-2" :class="getLevelBadgeClass(point.level)">{{ point.level }}</span>
          </div>
          <div class="flex items-center justify-end gap-2 mt-1">
            <button
              @click="openScoreModal(point)"
              class="flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-base-200 transition-colors text-xs font-bold"
              :class="getScoreColorClass(point.userScore ?? 0)"
            >
              <IconTarget class="w-3 h-3" />
              {{ point.userScore ?? 0 }}%
            </button>
            <button
              @click="resetPointScore(point.grammarPoint)"
              class="btn btn-ghost btn-xs gap-0.5 text-base-content/40 hover:text-base-content"
            >
              <IconRefreshCw class="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div v-if="filteredPoints.length > 0" class="bg-base-100 rounded-xl shadow-sm p-4">
        <div class="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div class="text-sm text-base-content/60">
            Page {{ currentPage }} of {{ totalPages }}
          </div>
          <div class="join">
            <button 
              class="join-item btn btn-sm"
              :disabled="currentPage === 1"
              @click="currentPage--"
            >
              ‹ Previous
            </button>
            <button class="join-item btn btn-sm no-animation">
              {{ currentPage }} / {{ totalPages }}
            </button>
            <button 
              class="join-item btn btn-sm"
              :disabled="currentPage === totalPages"
              @click="currentPage++"
            >
              Next ›
            </button>
          </div>
          <button @click="resetAllScores" class="btn btn-outline btn-error btn-sm gap-2">
            <IconTrash class="w-4 h-4" />
            Reset All
          </button>
        </div>
      </div>
    </div>

    <!-- Score Modal -->
    <dialog ref="scoreModal" class="modal">
      <div class="modal-box">
        <h3 class="font-bold text-lg mb-4">Set Mastery Level</h3>
        <div v-if="selectedPoint" class="space-y-4">
          <div>
            <p class="font-semibold text-base-content">{{ selectedPoint.grammarPoint }}</p>
            <p class="text-sm text-base-content/60 mt-1">{{ selectedPoint.japanese }}</p>
            <p class="text-sm text-base-content/60">{{ selectedPoint.english }}</p>
          </div>
          
          <div class="space-y-3">
            <div class="flex justify-between items-center">
              <span class="text-sm text-base-content/70">Current Score</span>
              <span class="text-3xl font-bold" :class="getScoreColorClass(tempScore)">{{ tempScore }}%</span>
            </div>
            
            <input
              v-model.number="tempScore"
              type="range"
              min="0"
              max="100"
              step="5"
              class="range range-sm"
              :class="getRangeClass(tempScore)"
            />
            
            <div class="flex justify-between text-xs text-base-content/50">
              <span>0%</span>
              <span>25%</span>
              <span>50%</span>
              <span>75%</span>
              <span>100%</span>
            </div>

            <div class="grid grid-cols-5 gap-2 mt-4">
              <button
                v-for="preset in [0, 25, 50, 75, 100]"
                :key="preset"
                @click="tempScore = preset"
                class="btn btn-sm"
                :class="tempScore === preset ? 'btn-primary' : 'btn-outline'"
              >
                {{ preset }}%
              </button>
            </div>
          </div>

          <div class="modal-action">
            <button @click="closeScoreModal" class="btn btn-ghost">Cancel</button>
            <button @click="saveScore" class="btn btn-primary">Save</button>
          </div>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button>close</button>
      </form>
    </dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import IconBookOpen from '~icons/lucide/book-open'
import IconSearch from '~icons/lucide/search'
import IconRefreshCw from '~icons/lucide/refresh-cw'
import IconTrash from '~icons/lucide/trash-2'
import IconTarget from '~icons/lucide/target'

definePageMeta({
  layout: 'default'
})

const { grammarPoints, loadGrammarPoints, updateScore, getProficiencyForLevel, getGrammarByLevel, resetScores } = useGrammarCatalog()

const loading = ref(true)
const searchQuery = ref('')
const selectedLevel = ref('')
const currentPage = ref(1)
const itemsPerPage = 30
const levels = ['N5', 'N4', 'N3', 'N2', 'N1']
const scoreModal = ref(null)
const selectedPoint = ref(null)
const tempScore = ref(0)

const filteredPoints = computed(() => {
  let filtered = grammarPoints.value
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase().trim()
    filtered = filtered.filter(p =>
      p.grammarPoint.toLowerCase().includes(q) ||
      p.japanese.toLowerCase().includes(q) ||
      p.english.toLowerCase().includes(q)
    )
  }
  if (selectedLevel.value) {
    filtered = filtered.filter(p => p.level === selectedLevel.value)
  }
  return filtered.sort((a, b) => (b.userScore ?? 0) - (a.userScore ?? 0))
})

const totalPages = computed(() => Math.ceil(filteredPoints.value.length / itemsPerPage))

const paginatedPoints = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return filteredPoints.value.slice(start, end)
})

const overallProficiency = computed(() => {
  const avg = grammarPoints.value.length > 0 
    ? grammarPoints.value.reduce((sum, p) => sum + (p.userScore ?? 0), 0) / grammarPoints.value.length 
    : 0
  return Math.round(avg)
})

const levelsSummary = computed(() => {
  return levels.map(l => ({
    level: l,
    proficiency: getProficiencyForLevel(l)
  }))
})

const masteredCount = computed(() => grammarPoints.value.filter(p => (p.userScore ?? 0) >= 80).length)

const getLevelBadgeClass = (level) => {
  const classes = {
    'N5': 'badge-success',
    'N4': 'badge-info',
    'N3': 'badge-warning',
    'N2': 'badge-secondary',
    'N1': 'badge-error'
  }
  return classes[level] || 'badge-neutral'
}

const getCardBgClass = (level) => {
  const classes = {
    'N5': 'bg-success/5',
    'N4': 'bg-info/5',
    'N3': 'bg-warning/5',
    'N2': 'bg-secondary/5',
    'N1': 'bg-error/5'
  }
  return classes[level] || 'bg-neutral/5'
}

const getLevelProgressClass = (level) => {
  const classes = {
    'N5': 'bg-success',
    'N4': 'bg-info',
    'N3': 'bg-warning',
    'N2': 'bg-secondary',
    'N1': 'bg-error'
  }
  return classes[level] || 'bg-neutral'
}

const getRangeClass = (score) => {
  if (score >= 80) return 'range-success'
  if (score >= 60) return 'range-info'
  if (score >= 40) return 'range-warning'
  return 'range-error'
}

const getBadgeClass = (score) => {
  if (score >= 80) return 'badge-success'
  if (score >= 60) return 'badge-info'
  if (score >= 40) return 'badge-warning'
  return 'badge-error'
}

const getScoreColorClass = (score) => {
  if (score >= 80) return 'text-success'
  if (score >= 60) return 'text-info'
  if (score >= 40) return 'text-warning'
  return 'text-error'
}

const getLevelLabel = (score) => {
  if (score >= 80) return 'Mastered'
  if (score >= 60) return 'Proficient'
  if (score >= 40) return 'Learning'
  if (score >= 20) return 'Beginner'
  return 'Not Started'
}

const getLevelPointsSummary = (level) => {
  const levelPoints = getGrammarByLevel(level)
  const mastered = levelPoints.filter(p => (p.userScore ?? 0) >= 80).length
  return `${mastered}/${levelPoints.length}`
}

const openScoreModal = (point) => {
  selectedPoint.value = point
  tempScore.value = point.userScore ?? 0
  scoreModal.value?.showModal()
}

const closeScoreModal = () => {
  scoreModal.value?.close()
  selectedPoint.value = null
}

const saveScore = () => {
  if (selectedPoint.value) {
    selectedPoint.value.userScore = tempScore.value
    updateScore(selectedPoint.value.grammarPoint, tempScore.value)
    closeScoreModal()
  }
}

const resetPointScore = (grammarPoint) => {
  const point = grammarPoints.value.find(p => p.grammarPoint === grammarPoint)
  if (point) {
    point.userScore = 0
    updateScore(grammarPoint, 0)
  }
}

const resetAllScores = () => {
  if (confirm('Reset all grammar scores to 0? This cannot be undone.')) {
    resetScores()
  }
}

const resetFilters = () => {
  searchQuery.value = ''
  selectedLevel.value = ''
  currentPage.value = 1
}

watch([searchQuery, selectedLevel], () => {
  currentPage.value = 1
})

onMounted(async () => {
  await loadGrammarPoints()
  loading.value = false
  await nextTick()
})
</script>

<style scoped>
.no-animation {
  pointer-events: none;
}
</style>