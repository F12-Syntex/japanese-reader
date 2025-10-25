<template>
  <div class="h-full flex flex-col">
    <div class="bg-base-100 border-b border-base-300 p-4">
      <div class="flex items-center gap-4">
        <button @click="$emit('close')" class="btn btn-ghost btn-sm gap-2">
          <IconArrowLeft class="w-4 h-4" />
          Back to Library
        </button>
        <div class="flex-1">
          <h2 class="text-xl font-bold">{{ booksStore.currentBook?.title }}</h2>
          <p class="text-sm text-base-content/70">{{ booksStore.currentBook?.author }}</p>
        </div>
        <button @click="showToc = !showToc" class="btn btn-ghost btn-sm gap-2">
          <IconList class="w-4 h-4" />
          Chapters
        </button>
      </div>
    </div>

    <div class="drawer drawer-end flex-1">
      <input id="toc-drawer" type="checkbox" class="drawer-toggle" v-model="showToc" />
      <div class="drawer-content flex flex-col h-full">
        <div class="flex-1 overflow-hidden flex items-center justify-center bg-base-200">
          <div ref="viewerContainer" class="w-full max-w-4xl h-full bg-base-100"></div>
        </div>
        
        <div class="bg-base-100 border-t border-base-300 p-4">
          <div class="flex items-center justify-between max-w-4xl mx-auto">
            <button @click="prevPage" class="btn btn-ghost btn-sm gap-2" :disabled="!canGoPrev">
              <IconChevronLeft class="w-4 h-4" />
              Previous
            </button>
            
            <div class="flex items-center gap-4">
              <progress class="progress progress-primary w-64" :value="progress" max="100"></progress>
              <span class="text-sm">{{ Math.round(progress) }}%</span>
            </div>
            
            <button @click="nextPage" class="btn btn-ghost btn-sm gap-2" :disabled="!canGoNext">
              Next
              <IconChevronRight class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
      
      <div class="drawer-side z-10">
        <label for="toc-drawer" class="drawer-overlay"></label>
        <div class="menu p-4 w-80 min-h-full bg-base-100">
          <h3 class="text-lg font-bold mb-4">Table of Contents</h3>
          <ul class="menu bg-base-200 rounded-box">
            <li v-for="(item, index) in toc" :key="index">
              <a @click="goToChapter(item.href)" class="text-sm">{{ item.label }}</a>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import IconArrowLeft from '~icons/lucide/arrow-left'
import IconChevronLeft from '~icons/lucide/chevron-left'
import IconChevronRight from '~icons/lucide/chevron-right'
import IconList from '~icons/lucide/list'
import { useBooksStore } from '~/stores/useBooksStore'
import ePub from 'epubjs'
import type { Book, Rendition, NavItem } from 'epubjs'

defineEmits<{
  close: []
}>()

const booksStore = useBooksStore()
const viewerContainer = ref<HTMLElement | null>(null)
const showToc = ref(false)

let book: Book | null = null
let rendition: Rendition | null = null

const toc = ref<NavItem[]>([])
const progress = ref(0)
const canGoPrev = ref(false)
const canGoNext = ref(true)

const base64ToArrayBuffer = (base64: string): ArrayBuffer => {
  const binaryString = atob(base64)
  const bytes = new Uint8Array(binaryString.length)
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }
  return bytes.buffer
}

const initBook = async () => {
  if (!booksStore.currentBook || !viewerContainer.value) return

  const arrayBuffer = base64ToArrayBuffer(booksStore.currentBook.path)
  book = ePub(arrayBuffer)
  
  await book.ready

  rendition = book.renderTo(viewerContainer.value, {
    width: '100%',
    height: '100%',
    spread: 'none'
  })

  await rendition.display()

  const navigation = await book.loaded.navigation
  toc.value = navigation.toc

  rendition.on('relocated', (location: any) => {
    const percent = book?.locations.percentageFromCfi(location.start.cfi)
    if (percent !== undefined) {
      progress.value = percent * 100
    }
    
    canGoPrev.value = !location.atStart
    canGoNext.value = !location.atEnd
  })

  await book.locations.generate(1024)
}

const nextPage = () => {
  rendition?.next()
}

const prevPage = () => {
  rendition?.prev()
}

const goToChapter = (href: string) => {
  rendition?.display(href)
  showToc.value = false
}

const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'ArrowLeft') {
    e.preventDefault()
    prevPage()
  } else if (e.key === 'ArrowRight') {
    e.preventDefault()
    nextPage()
  }
}

onMounted(async () => {
  await initBook()
  window.addEventListener('keydown', handleKeydown)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeydown)
  rendition?.destroy()
  book?.destroy()
})
</script>