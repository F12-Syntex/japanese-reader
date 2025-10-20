<template>
  <div class="w-full h-full overflow-y-auto bg-base-200">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">

      <div class="stats stats-vertical sm:stats-horizontal bg-base-100 shadow w-full rounded-lg">
        <div class="stat">
          <div class="stat-figure text-primary"><IconTarget class="w-6 h-6" /></div>
          <div class="stat-title">Overall</div>
          <div class="stat-value text-primary">{{ overallProficiency }}%</div>
        </div>
        <div class="stat">
          <div class="stat-figure text-secondary"><IconBookOpen class="w-6 h-6" /></div>
          <div class="stat-title">Total Points</div>
          <div class="stat-value text-secondary">{{ grammarPoints.length }}</div>
        </div>
        <div class="stat">
          <div class="stat-figure text-success"><IconCheck class="w-6 h-6" /></div>
          <div class="stat-title">Mastered</div>
          <div class="stat-value text-success">{{ masteredCount }}</div>
        </div>
      </div>

      <div class="card bg-base-100 shadow-md">
        <div class="card-body">
          <div class="flex flex-col sm:flex-row gap-3">
            <label class="input input-bordered flex items-center gap-2 w-full sm:flex-1">
              <IconSearch class="w-4 h-4 opacity-70" />
              <input v-model="searchQuery" type="text" placeholder="Search grammar points..." class="grow" />
            </label>
            <select v-model="selectedLevel" class="select select-bordered w-full sm:w-40">
              <option value="">All Levels</option>
              <option v-for="level in levels" :key="level" :value="level">{{ level }}</option>
            </select>
            <button @click="resetFilters" class="btn btn-ghost">
              <IconRefreshCw class="w-4 h-4" /> Clear
            </button>
          </div>
        </div>
      </div>

      <p class="text-sm text-base-content/60">
        Showing {{ filteredPoints.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1 }}–{{ Math.min(currentPage * itemsPerPage, filteredPoints.length) }} of {{ filteredPoints.length }} points
      </p>

      <div v-if="filteredPoints.length === 0" class="hero bg-base-100 rounded-lg border border-base-300 py-12">
        <div class="text-center">
          <IconSearch class="w-14 h-14 mx-auto mb-3 text-base-content/30" />
          <p class="text-base-content/60">No grammar points found</p>
        </div>
      </div>

      <div v-else>
        <div class="hidden sm:grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          <div
            v-for="point in paginatedPoints"
            :key="point.grammarPoint"
            class="card bg-base-100 hover:shadow-lg transition-all duration-150"
          >
            <div class="card-body p-4">
              <div class="flex items-start justify-between">
                <div class="flex items-center gap-2">
                  <div class="w-8 h-8 rounded bg-primary/10 flex justify-center items-center">
                    <IconBookOpen class="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <h3 class="font-bold text-sm">{{ point.grammarPoint }}</h3>
                    <p class="text-xs text-base-content/70 truncate">{{ point.english }}</p>
                  </div>
                </div>
                <span class="badge badge-sm" :class="getLevelBadgeClass(point.level)">{{ point.level }}</span>
              </div>
              <div class="flex justify-end mt-2 gap-1">
                <button @click="openScoreModal(point)" class="btn btn-xs btn-outline gap-1" :class="getScoreButtonClass(point.userScore ?? 0)">
                  <IconTarget class="w-3 h-3" />{{ point.userScore ?? 0 }}%
                </button>
                <button @click="resetPointScore(point.grammarPoint)" class="btn btn-ghost btn-xs">
                  <IconRefreshCw class="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="sm:hidden space-y-3">
          <div
            v-for="point in paginatedPoints"
            :key="point.grammarPoint"
            class="card bg-base-100 shadow-sm"
          >
            <div class="card-body px-4 py-3">
              <div class="flex justify-between">
                <div>
                  <p class="font-semibold">{{ point.grammarPoint }}</p>
                  <p class="text-xs text-base-content/60">{{ point.english }}</p>
                </div>
                <span class="badge badge-sm" :class="getLevelBadgeClass(point.level)">{{ point.level }}</span>
              </div>
              <div class="flex justify-end mt-2 gap-2">
                <button @click="openScoreModal(point)" class="btn btn-xs btn-outline" :class="getScoreButtonClass(point.userScore ?? 0)">
                  <IconTarget class="w-3 h-3" /> {{ point.userScore ?? 0 }}%
                </button>
                <button @click="resetPointScore(point.grammarPoint)" class="btn btn-ghost btn-xs"><IconRefreshCw class="w-3 h-3" /></button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="filteredPoints.length > 0" class="card bg-base-100 shadow-md mt-4">
        <div class="card-body flex justify-between items-center">
          <div class="text-sm text-base-content/70">Page {{ currentPage }} of {{ totalPages }}</div>
          <div class="join">
            <button class="join-item btn btn-sm" :disabled="currentPage === 1" @click="currentPage--">‹</button>
            <button class="join-item btn btn-sm no-animation">{{ currentPage }}</button>
            <button class="join-item btn btn-sm" :disabled="currentPage === totalPages" @click="currentPage++">›</button>
          </div>
          <button @click="resetAllScores" class="btn btn-outline btn-error btn-sm">
            <IconTrash class="w-4 h-4" /> Reset All
          </button>
        </div>
      </div>
    </div>

    <dialog ref="scoreModal" class="modal">
      <div class="modal-box space-y-4">
        <h3 class="font-bold text-lg">Set Mastery Level</h3>
        <div v-if="selectedPoint">
          <p class="font-semibold">{{ selectedPoint.grammarPoint }}</p>
          <p class="text-sm text-base-content/60">{{ selectedPoint.english }}</p>
        </div>
        <div>
          <input v-model.number="tempScore" type="range" min="0" max="100" step="5" class="range range-primary" />
          <p class="text-center font-bold mt-2 text-primary">{{ tempScore }}%</p>
        </div>
        <div class="modal-action">
          <button @click="closeScoreModal" class="btn btn-ghost">Cancel</button>
          <button @click="saveScore" class="btn btn-primary">Save</button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop"><button>close</button></form>
    </dialog>
  </div>
</template>

<script setup lang="ts">
import IconBookOpen from '~icons/lucide/book-open'
import IconSearch from '~icons/lucide/search'
import IconRefreshCw from '~icons/lucide/refresh-cw'
import IconTrash from '~icons/lucide/trash-2'
import IconTarget from '~icons/lucide/target'
import IconCheck from '~icons/lucide/check'

definePageMeta({ layout: 'default' })

const { grammarPoints, loadGrammarPoints, updateScore, getProficiencyForLevel, getGrammarByLevel, resetScores } = useGrammarCatalog()

const searchQuery = ref('')
const selectedLevel = ref('')
const currentPage = ref(1)
const itemsPerPage = 30
const levels = ['N5', 'N4', 'N3', 'N2', 'N1']
const scoreModal = ref<HTMLDialogElement | null>(null)
const selectedPoint = ref<any>(null)
const tempScore = ref(0)

const filteredPoints = computed(() => {
  let filtered = grammarPoints.value
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase()
    filtered = filtered.filter(p =>
      [p.grammarPoint, p.japanese, p.english].some(v => v.toLowerCase().includes(q))
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

const getLevelBadgeClass = (level: string) => ({
  N5: 'badge-success',
  N4: 'badge-info',
  N3: 'badge-warning',
  N2: 'badge-secondary',
  N1: 'badge-error'
}[level] ?? 'badge-neutral')

const getScoreButtonClass = (score: number) => {
  if (score >= 80) return 'text-success border-success'
  if (score >= 60) return 'text-info border-info'
  if (score >= 40) return 'text-warning border-warning'
  return 'text-error border-error'
}

const resetFilters = () => {
  searchQuery.value = ''
  selectedLevel.value = ''
  currentPage.value = 1
}

const openScoreModal = (point: any) => {
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

const resetPointScore = (grammarPoint: string) => {
  const p = grammarPoints.value.find(x => x.grammarPoint === grammarPoint)
  if (p) {
    p.userScore = 0
    updateScore(grammarPoint, 0)
  }
}

const resetAllScores = () => {
  if (confirm('Reset all grammar scores?')) resetScores()
}

onMounted(async () => {
  await loadGrammarPoints()
})
</script>

<style scoped>
.no-animation {
  pointer-events: none;
}
</style>