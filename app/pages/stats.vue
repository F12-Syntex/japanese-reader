<template>
  <div class="h-screen w-full overflow-hidden pb-16">
    <div class="relative h-full w-full">
      <div class="absolute inset-0 overflow-y-auto overflow-x-hidden">
        <div class="mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12 max-w-6xl">
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
            <div class="card bg-base-100 shadow-lg overflow-y-auto">
              <div class="card-body p-4 sm:p-6">
                <div class="flex items-center justify-between mb-3">
                  <h3 class="text-sm sm:text-base font-semibold text-base-content/70">Proficiency</h3>
                  <IconBrain class="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                </div>
                <div class="text-3xl sm:text-4xl font-bold text-primary mb-2">{{ difficulty.toFixed(1) }}</div>
                <p class="text-xs sm:text-sm text-base-content/60 mb-3">{{ levelDescription }}</p>
                <div v-if="editingProficiency" class="space-y-3 pt-3 border-t border-base-content/10">
                  <input v-model.number="tempProficiency" type="range" min="0" max="100" step="0.5" class="range range-primary range-sm w-full" />
                  <div class="flex justify-between text-xs text-base-content/60">
                    <span>Beginner</span>
                    <span class="font-semibold text-primary">{{ tempProficiency.toFixed(1) }}</span>
                    <span>Native</span>
                  </div>
                  <div class="grid grid-cols-2 gap-2">
                    <button @click="saveProficiency" class="btn btn-primary btn-sm min-h-11" :disabled="tempProficiency === difficulty">
                      Save
                    </button>
                    <button @click="cancelEdit" class="btn btn-ghost btn-sm min-h-11">Cancel</button>
                  </div>
                </div>
                <button v-else @click="startEditProficiency" class="btn btn-ghost btn-sm min-h-11 w-full mt-2 flex items-center justify-center gap-2">
                  <IconEdit class="w-4 h-4" /> Edit Proficiency
                </button>
              </div>
            </div>

            <div class="card bg-base-100 shadow-lg">
              <div class="card-body p-4 sm:p-6">
                <div class="flex items-center justify-between mb-3">
                  <h3 class="text-sm sm:text-base font-semibold text-base-content/70">Grammar Tier</h3>
                  <IconRuler class="w-5 h-5 sm:w-6 sm:h-6 text-secondary" />
                </div>
                <div class="text-3xl sm:text-4xl font-bold text-secondary mb-2">{{ level }}</div>
                <p class="text-xs sm:text-sm text-base-content/60">Based on your difficulty</p>
              </div>
            </div>

            <div class="card bg-base-100 shadow-lg sm:col-span-2 lg:col-span-1">
              <div class="card-body p-4 sm:p-6">
                <div class="flex items-center justify-between mb-3">
                  <h3 class="text-sm sm:text-base font-semibold text-base-content/70">Consistency</h3>
                  <IconActivity class="w-5 h-5 sm:w-6 sm:h-6 text-accent" />
                </div>
                <div class="text-3xl sm:text-4xl font-bold text-accent mb-2">{{ (consistency * 100).toFixed(1) }}%</div>
                <p class="text-xs sm:text-sm text-base-content/60">Session stability score</p>
              </div>
            </div>
          </div>

          <div class="card bg-base-100 shadow-lg mb-6 sm:mb-8">
            <div class="card-body p-4 sm:p-6">
              <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 sm:mb-6">
                <h2 class="text-lg sm:text-xl font-bold flex items-center gap-2">
                  <IconTrendingUp class="w-5 h-5 text-primary" />
                  <span class="text-base sm:text-lg">Performance Over Time</span>
                </h2>
                <div class="badge badge-outline text-xs sm:text-sm px-3 py-2">{{ history.length }} sessions</div>
              </div>
              <div class="w-full overflow-hidden">
                <canvas id="difficultyChart" class="w-full max-h-64 sm:max-h-80"></canvas>
              </div>
            </div>
          </div>

          <div class="card bg-base-100 shadow-lg">
            <div class="card-body p-4 sm:p-6">
              <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 sm:mb-6">
                <h2 class="text-lg sm:text-xl font-bold flex items-center gap-2">
                  <IconList class="w-5 h-5 text-primary" /> 
                  <span class="text-base sm:text-lg">Session History</span>
                </h2>
                <button @click="resetHistory" class="btn btn-outline btn-error btn-sm min-h-11 gap-2 w-full sm:w-auto">
                  <IconTrash class="w-4 h-4" /> Clear History
                </button>
              </div>

              <div v-if="history.length === 0" class="text-center py-12">
                <div class="text-base-content/40 mb-2">
                  <IconList class="w-12 h-12 mx-auto mb-3" />
                </div>
                <p class="text-base-content/60 text-sm sm:text-base italic">
                  No data yet. Read something and give feedback!
                </p>
              </div>

              <div v-else class="space-y-4">
                <div class="hidden md:block overflow-x-auto -mx-4 px-4">
                  <table class="table table-sm w-full min-w-[640px]">
                    <thead>
                      <tr class="border-b border-base-content/10">
                        <th class="text-xs sm:text-sm">Date</th>
                        <th class="text-xs sm:text-sm">Feedback</th>
                        <th class="text-xs sm:text-sm">Proficiency</th>
                        <th class="text-xs sm:text-sm">JLPT Level</th>
                        <th class="text-xs sm:text-sm">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="(entry, i) in paginatedHistory" :key="i" class="hover:bg-base-200/50">
                        <td class="text-xs sm:text-sm">{{ formatDate(entry.timestamp) }}</td>
                        <td>
                          <span :class="feedbackColor(entry.feedback)" class="badge badge-sm text-xs capitalize">
                            {{ entry.feedback }}
                          </span>
                        </td>
                        <td class="text-xs sm:text-sm font-semibold">{{ entry.score.toFixed(1) }}</td>
                        <td class="text-xs sm:text-sm">{{ getLevelFromScore(entry.score) }}</td>
                        <td>
                          <div class="flex gap-2">
                            <button @click="editHistoryEntry(i)" class="btn btn-xs btn-ghost min-h-8 min-w-8 p-2" aria-label="Edit entry">
                              <IconEdit class="w-3 h-3" />
                            </button>
                            <button @click="deleteHistoryEntry(i)" class="btn btn-xs btn-ghost btn-error min-h-8 min-w-8 p-2" aria-label="Delete entry">
                              <IconTrash class="w-3 h-3" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div class="md:hidden space-y-3">
                  <div v-for="(entry, i) in paginatedHistory" :key="i" class="card bg-base-200 shadow-sm border border-base-content/5">
                    <div class="card-body p-4">
                      <div class="flex items-start justify-between mb-3">
                        <div>
                          <p class="font-semibold text-sm mb-1">{{ formatDate(entry.timestamp) }}</p>
                          <p class="text-xs text-base-content/60">
                            Proficiency: <span class="font-semibold text-primary">{{ entry.score.toFixed(1) }}</span>
                          </p>
                        </div>
                        <span :class="feedbackColor(entry.feedback)" class="badge badge-sm capitalize">{{ entry.feedback }}</span>
                      </div>
                      <div class="flex items-center justify-between pt-3 border-t border-base-content/10">
                        <span class="text-xs text-base-content/60">
                          JLPT: <span class="font-semibold">{{ getLevelFromScore(entry.score) }}</span>
                        </span>
                        <div class="flex gap-2">
                          <button @click="editHistoryEntry(i)" class="btn btn-xs btn-ghost min-h-11 min-w-11 p-2" aria-label="Edit entry">
                            <IconEdit class="w-4 h-4" />
                          </button>
                          <button @click="deleteHistoryEntry(i)" class="btn btn-xs btn-ghost btn-error min-h-11 min-w-11 p-2" aria-label="Delete entry">
                            <IconTrash class="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div v-if="totalPages > 1" class="flex justify-center mt-6">
                  <div class="join">
                    <button class="join-item btn btn-sm min-h-11 px-4" :disabled="currentPage === 1" @click="currentPage--" aria-label="Previous page">‹</button>
                    <button class="join-item btn btn-sm min-h-11 px-4 pointer-events-none">Page {{ currentPage }} / {{ totalPages }}</button>
                    <button class="join-item btn btn-sm min-h-11 px-4" :disabled="currentPage === totalPages" @click="currentPage++" aria-label="Next page">›</button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <dialog id="editModal" class="modal">
            <div class="modal-box max-w-sm sm:max-w-md mx-4">
              <h3 class="font-bold text-lg sm:text-xl mb-4">Edit Proficiency Score</h3>
              <div class="space-y-4">
                <input v-model.number="tempEntryScore" type="range" min="0" max="100" step="0.5" class="range range-primary w-full" />
                <div class="text-center">
                  <p class="text-3xl font-bold text-primary">{{ tempEntryScore.toFixed(1) }}</p>
                  <p class="text-xs text-base-content/60 mt-1">{{ getProficiencyDescription(tempEntryScore) }}</p>
                </div>
              </div>
              <div class="modal-action mt-6">
                <div class="grid grid-cols-2 gap-3 w-full">
                  <button class="btn btn-primary min-h-11" @click="saveHistoryEntry(editingEntryIndex)">Save Changes</button>
                  <button class="btn btn-ghost min-h-11" @click="closeModal">Cancel</button>
                </div>
              </div>
            </div>
            <form method="dialog" class="modal-backdrop">
              <button @click="closeModal">close</button>
            </form>
          </dialog>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import Chart from 'chart.js/auto'
import IconActivity from '~icons/lucide/activity'
import IconTrash from '~icons/lucide/trash-2'
import IconBrain from '~icons/lucide/brain'
import IconTrendingUp from '~icons/lucide/trending-up'
import IconList from '~icons/lucide/list'
import IconRuler from '~icons/lucide/ruler'
import IconEdit from '~icons/lucide/edit-3'

definePageMeta({ layout: 'default' })

const { difficulty, loadDifficulty, getLevelFromScore, getProficiencyDescription, setDifficulty } = useDifficulty()
const { history: rawHistory, loadHistory, getConsistency } = useStats()

const history = ref<any[]>(rawHistory.value)
const currentPage = ref<number>(1)
const itemsPerPage = 5
const editingProficiency = ref<boolean>(false)
const tempProficiency = ref<number>(difficulty.value)
const editingEntryIndex = ref<number | null>(null)
const tempEntryScore = ref<number>(0)
const consistency = computed(() => Number(getConsistency()))
const levelDescription = computed(() => getProficiencyDescription(difficulty.value))
const level = computed(() => getLevelFromScore(difficulty.value))
const sortedHistory = computed(() => [...history.value].sort((a, b) => b.timestamp - a.timestamp))
const totalPages = computed(() => Math.ceil(sortedHistory.value.length / itemsPerPage))
const paginatedHistory = computed(() => sortedHistory.value.slice((currentPage.value - 1) * itemsPerPage, currentPage.value * itemsPerPage))

watch(rawHistory, newHistory => (history.value = newHistory))

onMounted(() => {
  loadDifficulty()
  loadHistory()
  nextTick(() => {
    const ctx = document.getElementById('difficultyChart') as HTMLCanvasElement | null
    if (!ctx || history.value.length === 0) return
    new Chart(ctx, {
      type: 'line',
      data: {
        labels: history.value.map(h => new Date(h.timestamp).toLocaleDateString()),
        datasets: [
          {
            label: 'Proficiency',
            data: history.value.map(h => h.score),
            fill: true,
            borderColor: '#16a34a',
            backgroundColor: 'rgba(22,163,74,0.2)',
            tension: 0.3,
            pointRadius: 4,
            pointHoverRadius: 6
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (context) => {
                const y = context.parsed && context.parsed.y != null ? context.parsed.y : (context.raw ?? 0)
                return `Proficiency: ${Number(y).toFixed(1)}`
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            ticks: {
              callback: (value) => `${value}`
            }
          }
        }
      }
    })
  })
})

const formatDate = (ts: number) => {
  const date = new Date(ts)
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

const feedbackColor = (feedback: string) => {
  if (feedback === 'easy') return 'badge-success'
  if (feedback === 'okay') return 'badge-primary'
  if (feedback === 'hard') return 'badge-error'
  return 'badge-neutral'
}

const resetHistory = () => {
  if (confirm('Are you sure you want to clear all session records? This action cannot be undone.')) {
    localStorage.removeItem('readerHistory')
    history.value = []
    currentPage.value = 1
  }
}

const startEditProficiency = () => {
  editingProficiency.value = true
  tempProficiency.value = difficulty.value
}

const saveProficiency = () => {
  setDifficulty(tempProficiency.value)
  editingProficiency.value = false
}

const cancelEdit = () => {
  editingProficiency.value = false
  tempProficiency.value = difficulty.value
}

const editHistoryEntry = (i: number) => {
  editingEntryIndex.value = i
  tempEntryScore.value = sortedHistory.value[i].score
  ;(document.getElementById('editModal') as HTMLDialogElement)?.showModal()
}

const saveHistoryEntry = (i: number | null) => {
  if (i === null) return
  const actualIndex = history.value.findIndex(entry => entry === sortedHistory.value[i])
  if (actualIndex !== -1) {
    history.value[actualIndex].score = tempEntryScore.value
    if (import.meta.client) localStorage.setItem('readerHistory', JSON.stringify(history.value))
  }
  closeModal()
}

const deleteHistoryEntry = (i: number) => {
  if (confirm('Are you sure you want to delete this session? This action cannot be undone.')) {
    const actualIndex = history.value.findIndex(entry => entry === sortedHistory.value[i])
    if (actualIndex !== -1) {
      history.value.splice(actualIndex, 1)
      if (import.meta.client) localStorage.setItem('readerHistory', JSON.stringify(history.value))
      if (sortedHistory.value.length <= (currentPage.value - 1) * itemsPerPage && currentPage.value > 1) {
        currentPage.value--
      }
    }
  }
}

const closeModal = () => (document.getElementById('editModal') as HTMLDialogElement)?.close()
</script>