<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between mb-4">
      <div>
        <h3 class="text-base font-bold">Anki Data</h3>
        <p class="text-xs text-base-content/60 mt-1">View your imported Anki vocabulary</p>
      </div>
      <button @click="navigateTo('/settings')" class="btn btn-ghost btn-sm gap-2">
        <IconArrowLeft class="w-4 h-4" />
        Back
      </button>
    </div>

    <div class="stats stats-vertical sm:stats-horizontal shadow w-full">
      <div class="stat">
        <div class="stat-title">Total Words</div>
        <div class="stat-value text-primary">{{ knownWords.size.toLocaleString() }}</div>
      </div>
      <div class="stat">
        <div class="stat-title">With Definitions</div>
        <div class="stat-value text-secondary">{{ totalWordsWithDefinitions }}</div>
        <div class="stat-desc">{{ loadingDefinitionsCount ? 'Calculating...' : '' }}</div>
      </div>
    </div>

    <div class="form-control">
      <input 
        v-model="searchQuery" 
        type="text" 
        placeholder="Search vocabulary..." 
        class="input input-bordered w-full"
      />
    </div>

    <div class="divider text-sm">Vocabulary</div>

    <div v-if="dictionaryStore.loading" class="flex justify-center py-12">
      <span class="loading loading-spinner loading-lg"></span>
    </div>

    <div v-else-if="filteredWords.length > 0" class="space-y-3">
      <div 
        v-for="word in paginatedWords" 
        :key="word" 
        class="card bg-base-200 border border-base-300 hover:shadow-md transition-shadow"
      >
        <div class="card-body p-4">
          <div class="flex justify-between items-start gap-4">
            <div class="flex-1">
              <h4 class="text-xl font-bold mb-2">{{ word }}</h4>
              <div v-if="currentPageDefinitions.get(word) && currentPageDefinitions.get(word)!.length > 0" class="text-sm">
                {{ currentPageDefinitions.get(word)!.join('; ') }}
              </div>
              <div v-else class="text-sm text-base-content/40 italic">
                No definition found
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="totalPages > 1" class="flex justify-center">
        <div class="join">
          <button 
            class="join-item btn btn-sm" 
            :disabled="currentPage === 1"
            @click="currentPage--"
          >
            «
          </button>
          <button class="join-item btn btn-sm">
            Page {{ currentPage }} / {{ totalPages }}
          </button>
          <button 
            class="join-item btn btn-sm"
            :disabled="currentPage === totalPages"
            @click="currentPage++"
          >
            »
          </button>
        </div>
      </div>
    </div>

    <div v-else class="flex flex-col items-center justify-center py-12 text-center">
      <IconInfo class="w-12 h-12 text-base-content/20 mb-4" />
      <p class="text-sm text-base-content/60">
        {{ searchQuery ? 'No words match your search' : 'No words imported yet' }}
      </p>
      <p class="text-xs text-base-content/40 mt-2">
        {{ searchQuery ? 'Try a different search term' : 'Import an Anki deck to see your vocabulary here' }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import IconArrowLeft from '~icons/lucide/arrow-left'
import IconInfo from '~icons/lucide/info'

const ankiStore = useAnkiStore()
const dictionaryStore = useDictionaryStore()
const knownWords = computed(() => ankiStore.knownWords)
const searchQuery = ref('')
const currentPage = ref(1)
const itemsPerPage = 10
const totalWordsWithDefinitions = ref(0)
const loadingDefinitionsCount = ref(false)

onMounted(async () => {
  if (!dictionaryStore.isLoaded) {
    await dictionaryStore.loadDictionary()
  }
  calculateTotalWithDefinitions()
})

const calculateTotalWithDefinitions = async () => {
  loadingDefinitionsCount.value = true
  let count = 0
  const batchSize = itemsPerPage
  const wordsArray = Array.from(knownWords.value)
  
  for (let i = 0; i < wordsArray.length; i += batchSize) {
    const batch = wordsArray.slice(i, i + batchSize)
    for (const word of batch) {
      const meanings = dictionaryStore.lookupWord(word)
      if (meanings && meanings.trim().length > 0) {
        count++
      }
    }
    await new Promise(resolve => setTimeout(resolve, 0))
  }
  
  totalWordsWithDefinitions.value = count
  loadingDefinitionsCount.value = false
}

const sortedWords = computed(() => {
  return Array.from(knownWords.value).sort((a, b) => a.localeCompare(b, 'ja'))
})

const filteredWords = computed(() => {
  if (!searchQuery.value.trim()) {
    return sortedWords.value
  }
  const query = searchQuery.value.toLowerCase()
  return sortedWords.value.filter(word => word.toLowerCase().includes(query))
})

const totalPages = computed(() => {
  return Math.ceil(filteredWords.value.length / itemsPerPage)
})

const paginatedWords = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return filteredWords.value.slice(start, end)
})

const currentPageDefinitions = computed(() => {
  const map = new Map<string, string[]>()
  for (const word of paginatedWords.value) {
    const meanings = dictionaryStore.lookupWord(word)
    if (meanings) {
      map.set(word, meanings.split(','))
    }
  }
  return map
})

watch(filteredWords, () => {
  currentPage.value = 1
})
</script>