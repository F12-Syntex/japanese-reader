<template>
  <div class="w-full h-full overflow-y-auto">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      <div class="stats stats-vertical sm:stats-horizontal shadow w-full bg-base-100">
        <div class="stat">
          <div class="stat-figure text-primary"><IconBrain class="w-6 h-6" /></div>
          <div class="stat-title">Proficiency</div>
          <div class="stat-value text-primary">{{ difficulty.toFixed(1) }}</div>
          <div class="stat-desc">{{ levelDescription }}</div>
          <div v-if="editingProficiency" class="mt-2 space-y-2">
            <input v-model.number="tempProficiency" type="range" min="0" max="100" step="0.5" class="range range-primary w-full" />
            <div class="flex justify-between text-xs text-base-content/60">
              <span>Beginner</span>
              <span>{{ tempProficiency.toFixed(1) }}</span>
              <span>Native</span>
            </div>
            <div class="flex gap-2 pt-2">
              <button @click="saveProficiency" class="btn btn-primary btn-xs flex-1" :disabled="tempProficiency === difficulty">Save</button>
              <button @click="cancelEdit" class="btn btn-ghost btn-xs flex-1">Cancel</button>
            </div>
          </div>
          <button v-else @click="startEditProficiency" class="btn btn-xs btn-ghost mt-1 flex items-center gap-1">
            <IconEdit class="w-3 h-3" /> Edit
          </button>
        </div>

        <div class="stat">
          <div class="stat-figure text-secondary"><IconRuler class="w-6 h-6" /></div>
          <div class="stat-title">Grammar Tier</div>
          <div class="stat-value text-secondary">{{ level }}</div>
          <div class="stat-desc">Based on your difficulty</div>
        </div>

        <div class="stat">
          <div class="stat-figure text-accent"><IconActivity class="w-6 h-6" /></div>
          <div class="stat-title">Consistency</div>
          <div class="stat-value text-accent">{{ (consistency * 100).toFixed(1) }}%</div>
          <div class="stat-desc">Session stability score</div>
        </div>
      </div>

      <div class="card bg-base-100 shadow-md">
        <div class="card-body">
          <div class="flex items-center justify-between mb-4">
            <h2 class="card-title flex items-center gap-2">
              <IconTrendingUp class="w-5 h-5 text-primary" /> Performance Over Time
            </h2>
            <div class="badge badge-outline text-xs">{{ history.length }} sessions</div>
          </div>
          <canvas id="difficultyChart" class="w-full max-h-72"></canvas>
        </div>
      </div>

      <div class="card bg-base-100 shadow-md">
        <div class="card-body">
          <div class="flex items-center justify-between mb-4">
            <h2 class="card-title flex items-center gap-2">
              <IconList class="w-5 h-5 text-primary" /> Session History
            </h2>
            <button @click="resetHistory" class="btn btn-outline btn-error btn-sm gap-2">
              <IconTrash class="w-4 h-4" /> Clear
            </button>
          </div>

          <div v-if="history.length === 0" class="text-base-content/60 italic text-center py-6">
            No data yet. Read something and give feedback!
          </div>

          <div v-else>
            <div class="hidden sm:block overflow-x-auto">
              <table class="table table-sm w-full">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Feedback</th>
                    <th>Proficiency</th>
                    <th>JLPT Level</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(entry, i) in paginatedHistory" :key="i">
                    <td>{{ formatDate(entry.timestamp) }}</td>
                    <td><span :class="feedbackColor(entry.feedback)" class="badge text-xs capitalize">{{ entry.feedback }}</span></td>
                    <td>{{ entry.score.toFixed(1) }}</td>
                    <td>{{ getLevelFromScore(entry.score) }}</td>
                    <td>
                      <div class="join">
                        <button @click="editHistoryEntry(i)" class="join-item btn btn-xs btn-ghost"><IconEdit class="w-3 h-3" /></button>
                        <button @click="deleteHistoryEntry(i)" class="join-item btn btn-xs btn-ghost btn-error"><IconTrash class="w-3 h-3" /></button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="sm:hidden space-y-4">
              <div v-for="(entry, i) in paginatedHistory" :key="i" class="card bg-base-200 shadow-sm">
                <div class="card-body p-4 text-sm">
                  <div class="flex justify-between">
                    <span class="font-semibold">{{ formatDate(entry.timestamp) }}</span>
                    <span :class="feedbackColor(entry.feedback)" class="badge text-xs capitalize">{{ entry.feedback }}</span>
                  </div>
                  <p>Proficiency: {{ entry.score.toFixed(1) }} · JLPT: {{ getLevelFromScore(entry.score) }}</p>
                  <div class="join mt-2">
                    <button @click="editHistoryEntry(i)" class="join-item btn btn-xs btn-ghost"><IconEdit class="w-3 h-3" /></button>
                    <button @click="deleteHistoryEntry(i)" class="join-item btn btn-xs btn-ghost btn-error"><IconTrash class="w-3 h-3" /></button>
                  </div>
                </div>
              </div>
            </div>

            <div v-if="totalPages > 1" class="flex justify-center mt-4">
              <div class="join">
                <button class="join-item btn btn-sm" :disabled="currentPage === 1" @click="currentPage--">‹</button>
                <button class="join-item btn btn-sm">Page {{ currentPage }} / {{ totalPages }}</button>
                <button class="join-item btn btn-sm" :disabled="currentPage === totalPages" @click="currentPage++">›</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <dialog id="editModal" class="modal">
        <div class="modal-box">
          <h3 class="font-bold text-lg mb-2">Edit Proficiency Score</h3>
          <input v-model.number="tempEntryScore" type="range" min="0" max="100" step="0.5" class="range range-primary w-full" />
          <p class="text-center mt-2">{{ tempEntryScore.toFixed(1) }}</p>
          <div class="modal-action">
            <button class="btn btn-primary" @click="saveHistoryEntry(editingEntryIndex)">Save</button>
            <button class="btn" @click="closeModal">Cancel</button>
          </div>
        </div>
      </dialog>
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
          tension: 0.3
        }
      ]
    },
    options: { responsive: true, plugins: { legend: { display: false } } }
  })
})

const formatDate = (ts: number) => new Date(ts).toLocaleDateString()
const feedbackColor = (feedback: string) => feedback === 'easy' ? 'badge-success' : feedback === 'okay' ? 'badge-primary' : feedback === 'hard' ? 'badge-error' : 'badge-neutral'

const resetHistory = () => {
  if (confirm('Clear all records?')) {
    localStorage.removeItem('readerHistory')
    history.value = []
    currentPage.value = 1
  }
}

const startEditProficiency = () => { editingProficiency.value = true; tempProficiency.value = difficulty.value }
const saveProficiency = () => { setDifficulty(tempProficiency.value); editingProficiency.value = false }
const cancelEdit = () => { editingProficiency.value = false; tempProficiency.value = difficulty.value }

const editHistoryEntry = (i: number) => {
  editingEntryIndex.value = i
  tempEntryScore.value = sortedHistory.value[i].score
  ;(document.getElementById('editModal') as HTMLDialogElement)?.showModal()
}

const saveHistoryEntry = (i: number | null) => {
  if (i === null) return
  const actualIndex = sortedHistory.value.length - 1 - i
  history.value[actualIndex].score = tempEntryScore.value
  if (import.meta.client) localStorage.setItem('readerHistory', JSON.stringify(history.value))
  closeModal()
}

const deleteHistoryEntry = (i: number) => {
  if (confirm('Delete this session?')) {
    const actualIndex = sortedHistory.value.length - 1 - i
    history.value.splice(actualIndex, 1)
    if (import.meta.client) localStorage.setItem('readerHistory', JSON.stringify(history.value))
    if (sortedHistory.value.length <= (currentPage.value - 1) * itemsPerPage) currentPage.value--
  }
}

const closeModal = () => (document.getElementById('editModal') as HTMLDialogElement)?.close()
</script>