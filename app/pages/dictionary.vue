<template>
  <div class="min-h-screen bg-base-200 p-4 sm:p-6">
    <div class="container mx-auto max-w-4xl">
      <h1 class="text-3xl sm:text-4xl font-bold mb-6 text-center">JMdict Dictionary</h1>

      <div class="card bg-base-100 shadow-xl mb-6">
        <div class="card-body">
          <div class="form-control">
            <input
              v-model="query"
              type="text"
              placeholder="Search exact kanji or kana (e.g. 食べる or たべる)..."
              class="input input-bordered input-lg w-full"
              @keyup.enter="search"
            />
          </div>
          <div class="card-actions justify-end mt-4">
            <button class="btn btn-primary btn-lg" @click="search" :disabled="loading">
              <span v-if="loading" class="loading loading-spinner loading-sm"></span>
              {{ loading ? 'Searching...' : 'Search' }}
            </button>
          </div>
        </div>
      </div>

      <div v-if="loading" class="flex justify-center py-12">
        <span class="loading loading-spinner loading-lg"></span>
      </div>

      <div v-else-if="results.length" class="space-y-4">
        <div v-for="word in results" :key="word.id" class="card bg-base-100 shadow-lg">
          <div class="card-body">
            <h2 class="card-title text-2xl">
              <span v-if="word.kanji.length" class="text-primary">{{ word.kanji.join(', ') }}</span>
              <span v-else class="text-secondary">{{ word.kana.join(', ') }}</span>
            </h2>

            <div v-if="word.kanji.length && word.kana.length" class="text-lg text-secondary mb-2">
              {{ word.kana.join(', ') }}
            </div>

            <div class="divider my-2"></div>

            <ul class="list-disc list-inside space-y-1">
              <li v-for="(gloss, idx) in word.glosses.slice(0, 10)" :key="idx" class="text-base sm:text-lg">
                {{ gloss }}
              </li>
            </ul>

            <div v-if="word.glosses.length > 10" class="badge badge-info mt-2">
              +{{ word.glosses.length - 10 }} more meanings
            </div>
          </div>
        </div>
      </div>

      <div v-else-if="searched && !results.length" class="alert alert-info shadow-lg">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="stroke-current shrink-0 w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        <span>No results found for "{{ query }}"</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { searchWords } = useJMdict()

const query = ref('')
const results = ref<Awaited<ReturnType<typeof searchWords>>>([])
const loading = ref(false)
const searched = ref(false)

async function search() {
  if (!query.value.trim()) return
  loading.value = true
  searched.value = true
  try {
    results.value = await searchWords(query.value)
  } finally {
    loading.value = false
  }
}
</script>