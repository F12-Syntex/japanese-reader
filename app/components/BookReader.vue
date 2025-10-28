<template>
  <div class="h-screen flex flex-col bg-base-200">
    <div class="navbar bg-base-100 shadow-lg">
      <div class="flex-1">
        <button @click="navigateTo('/books')" class="btn btn-ghost btn-sm">
          ← Back
        </button>
        <h1 class="text-xl font-bold ml-4">{{ currentBook?.title }}</h1>
      </div>
      <div class="flex-none gap-2">
        <div class="flex items-center gap-2">
          <button @click="pdfReader.prevPage()" :disabled="!pdfReader.canGoPrev.value" class="btn btn-sm btn-primary">
            Previous
          </button>
          <span class="text-sm">Page {{ pdfReader.currentPageIndex.value + 1 }} / {{ pdfReader.totalPages.value }}</span>
          <button @click="pdfReader.nextPage()" :disabled="!pdfReader.canGoNext.value" class="btn btn-sm btn-primary">
            Next
          </button>
        </div>
      </div>
    </div>

    <div class="flex-1 overflow-y-auto">
      <div v-if="pdfReader.isLoading.value" class="flex flex-col items-center gap-4 p-8">
        <span class="loading loading-spinner loading-lg"></span>
        <p>Loading page {{ pdfReader.currentPageIndex.value + 1 }}...</p>
      </div>
      <div v-else class="container mx-auto p-8">
        <div v-if="pdfReader.currentPageImage.value" class="flex justify-center">
          <img 
            :src="pdfReader.currentPageImage.value" 
            alt="PDF Page"
            class="max-w-full h-auto shadow-lg"
          />
        </div>
        <div v-if="pdfReader.currentPageText.value" class="mt-8 p-4 bg-base-100 rounded-lg">
          <p class="whitespace-pre-wrap">{{ pdfReader.currentPageText.value }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useBooksStore } from '~/stores/useBooksStore'
import { usePdfReader } from '~/composables/usePdfReader'

definePageMeta({
  ssr: false
})

const booksStore = useBooksStore()
const pdfReader = usePdfReader()
const currentBook = computed(() => booksStore.currentBook)

onMounted(async () => {
  if (!currentBook.value) {
    navigateTo('/books')
    return
  }

  try {
    await pdfReader.loadPdf(currentBook.value.path)
  } catch (error) {
    console.error('Error loading PDF:', error)
  }
})

onUnmounted(() => {
  pdfReader.destroy()
})
</script>