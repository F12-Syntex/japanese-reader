<template>
  <div class="min-h-screen bg-base-200">
    <!-- Header -->
    <header class="bg-base-100 border-b border-base-300 sticky top-0 z-50 shadow-sm">
      <div class="w-full flex items-center justify-between px-4 py-3">
        <div class="flex items-center gap-2">
          <IconBarChart class="w-6 h-6 text-primary" />
          <h1 class="text-2xl font-bold">Your Japanese Progress</h1>
        </div>
        <button 
          @click="navigateTo('/')"
          class="btn btn-sm btn-ghost gap-1"
          title="Back to Reader"
        >
          <IconArrowLeft class="w-4 h-4" />
          Back
        </button>
      </div>
    </header>

    <!-- Main -->
    <main class="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      <!-- Stats Overview -->
      <div class="stats shadow w-full">
        <div class="stat">
          <div class="stat-title flex items-center gap-1">
            <IconBrain class="w-4 h-4 text-primary" />
            Proficiency
          </div>
          <div class="stat-value text-primary">{{ difficulty.toFixed(1) }}</div>
          <div class="stat-desc">{{ levelDescription }}</div>
        </div>

        <div class="stat">
          <div class="stat-title flex items-center gap-1">
            <IconRuler class="w-4 h-4 text-secondary" />
            Grammar Tier
          </div>
          <div class="stat-value text-secondary">{{ level }}</div>
          <div class="stat-desc">Based on your difficulty</div>
        </div>

        <div class="stat">
          <div class="stat-title flex items-center gap-1">
            <IconActivity class="w-4 h-4 text-accent" />
            Consistency
          </div>
          <div class="stat-value text-accent">
            {{ (consistency * 100).toFixed(1) }}%
          </div>
          <div class="stat-desc">Session stability score</div>
        </div>
      </div>

      <!-- Chart -->
      <div class="bg-base-100 p-6 rounded-xl shadow-md">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-bold flex items-center gap-2">
            <IconTrendingUp class="w-5 h-5 text-primary" />
            Performance Over Time
          </h2>
          <div class="badge badge-outline text-xs">
            {{ history.length }} sessions logged
          </div>
        </div>

        <canvas id="difficultyChart" class="w-full max-h-72"></canvas>
      </div>

      <!-- History Table -->
      <div class="bg-base-100 rounded-xl shadow-md p-6">
        <h2 class="text-lg font-bold mb-3 flex items-center gap-2">
          <IconList class="w-5 h-5 text-primary" /> Session History
        </h2>

        <div v-if="history.length === 0" class="text-base-content/60 italic text-center py-6">
          No data yet. Read something and give feedback!
        </div>

        <div v-else class="overflow-x-auto">
          <table class="table table-sm w-full">
            <thead>
              <tr>
                <th>Date</th>
                <th>Feedback</th>
                <th>Proficiency</th>
                <th>JLPT Level</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(entry, i) in sortedHistory" :key="i">
                <td class="whitespace-nowrap">{{ formatDate(entry.timestamp) }}</td>
                <td>
                  <span :class="feedbackColor(entry.feedback)" class="badge text-xs capitalize">{{ entry.feedback }}</span>
                </td>
                <td>{{ entry.score.toFixed(1) }}</td>
                <td>{{ getLevelFromScore(entry.score) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Reset Stats -->
      <div class="text-right">
        <button @click="resetHistory" class="btn btn-outline btn-error btn-sm gap-2">
          <IconTrash class="w-4 h-4" /> Clear Stats
        </button>
      </div>
    </main>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import Chart from 'chart.js/auto'
import { useDifficulty } from '~/composables/useDifficulty'
import { useStats } from '~/composables/useStats'

import IconArrowLeft from '~icons/lucide/arrow-left'
import IconActivity from '~icons/lucide/activity'
import IconBarChart from '~icons/lucide/bar-chart-3'
import IconTrash from '~icons/lucide/trash-2'
import IconBrain from '~icons/lucide/brain'
import IconTrendingUp from '~icons/lucide/trending-up'
import IconList from '~icons/lucide/list'
import IconRuler from '~icons/lucide/ruler'

// Composables
const { difficulty, loadDifficulty, getLevelFromScore, getProficiencyDescription } = useDifficulty()
const { history, loadHistory, getConsistency } = useStats()

// Computed values
const consistency = computed(() => parseFloat(getConsistency()))
const levelDescription = computed(() => getProficiencyDescription(difficulty.value))
const level = computed(() => getLevelFromScore(difficulty.value))
const sortedHistory = computed(() => [...history.value].sort((a, b) => b.timestamp - a.timestamp))

// Chart rendering
onMounted(() => {
  loadDifficulty()
  loadHistory()

  const ctx = document.getElementById('difficultyChart')
  if (!ctx || history.value.length === 0) return

  new Chart(ctx, {
    type: 'line',
    data: {
      labels: history.value.map((h) => new Date(h.timestamp).toLocaleDateString()),
      datasets: [
        {
          label: 'Proficiency Score',
          data: history.value.map((h) => h.score),
          fill: true,
          borderColor: '#16a34a',
          backgroundColor: 'rgba(22, 163, 74, 0.2)',
          tension: 0.3,
          pointRadius: 4,
          pointHoverRadius: 5
        }
      ]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          min: 0,
          max: 100,
          ticks: { stepSize: 20 }
        }
      },
      plugins: {
        legend: { display: false }
      }
    }
  })
})

// Helpers
const formatDate = (ts) => new Date(ts).toLocaleDateString()

const feedbackColor = (feedback) => {
  switch (feedback) {
    case 'easy': return 'badge-success'
    case 'okay': return 'badge-primary'
    case 'hard': return 'badge-error'
    default: return 'badge-neutral'
  }
}

const resetHistory = () => {
  if (confirm('Clear all recorded study stats?')) {
    localStorage.removeItem('readerHistory')
    history.value = []
  }
}
</script>

<style scoped>
#difficultyChart {
  width: 100%;
  max-height: 17rem;
}
</style>