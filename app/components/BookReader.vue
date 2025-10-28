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
          <button @click="previousPage" :disabled="currentPage <= 1" class="btn btn-sm btn-primary">
            Previous
          </button>
          <span class="text-sm">Page {{ currentPage }} / {{ totalPages }}</span>
          <button @click="nextPage" :disabled="currentPage >= totalPages" class="btn btn-sm btn-primary">
            Next
          </button>
        </div>
      </div>
    </div>

    <div class="flex-1 flex items-center justify-center p-4 overflow-hidden">
      <div v-if="loading" class="flex flex-col items-center gap-4">
        <span class="loading loading-spinner loading-lg"></span>
        <p>Loading page {{ currentPage }}...</p>
      </div>
      <div v-show="!loading" class="max-w-full max-h-full overflow-auto">
        <canvas ref="pdfCanvas" class="shadow-2xl"></canvas>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useBooksStore } from '~/stores/useBooksStore'

definePageMeta({
  ssr: false
})

const booksStore = useBooksStore()
const currentBook = computed(() => booksStore.currentBook)
const pdfCanvas = ref<HTMLCanvasElement | null>(null)
const currentPage = ref(1)
const totalPages = ref(0)
const loading = ref(true)

let pdfjsLib: any = null
let pdfDoc: any = null

onMounted(async () => {
  if (!currentBook.value) {
    navigateTo('/books')
    return
  }

  try {
    pdfjsLib = await import('pdfjs-dist')
    const pdfjsWorker = await import('pdfjs-dist/build/pdf.worker.mjs?url')
    pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker.default

    const base64 = currentBook.value.path
    const binaryString = atob(base64)
    const len = binaryString.length
    const bytes = new Uint8Array(len)
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }

    pdfDoc = await pdfjsLib.getDocument({ data: bytes }).promise
    totalPages.value = pdfDoc.numPages
    await renderPage(currentPage.value)
  } catch (error) {
    console.error('Error loading PDF:', error)
    loading.value = false
  }
})

const renderPage = async (pageNum: number) => {
  if (!pdfDoc || !pdfCanvas.value) return

  loading.value = true
  
  try {
    const page = await pdfDoc.getPage(pageNum)
    const scale = 2.0
    const viewport = page.getViewport({ scale })
    const canvas = pdfCanvas.value
    const context = canvas.getContext('2d')

    if (!context) return

    canvas.height = viewport.height
    canvas.width = viewport.width

    const renderContext = {
      canvasContext: context,
      viewport: viewport
    }

    await page.render(renderContext).promise

    loading.value = false
  } catch (error) {
    console.error('Error rendering page:', error)
    loading.value = false
  }
}

const nextPage = async () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
    await renderPage(currentPage.value)
  }
}

const previousPage = async () => {
  if (currentPage.value > 1) {
    currentPage.value--
    await renderPage(currentPage.value)
  }
}
</script>