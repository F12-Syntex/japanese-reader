<template>
  <div ref="viewerContainer" class="w-full h-full bg-base-100 rounded-lg shadow-lg overflow-hidden"></div>
</template>

<script setup lang="ts">
import ePub from 'epubjs'
import type { Book, Rendition } from 'epubjs'

interface Props {
  bookData: string
  currentCfi?: string
}

interface Emits {
  (e: 'ready'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const viewerContainer = ref<HTMLElement | null>(null)

let book: Book | null = null
let rendition: Rendition | null = null

const base64ToArrayBuffer = (base64: string): ArrayBuffer => {
  const binaryString = atob(base64)
  const bytes = new Uint8Array(binaryString.length)
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }
  return bytes.buffer
}

const goTo = async (cfi: string | undefined) => {
  if (!rendition || !cfi) return
  await rendition.display(cfi)
}

defineExpose({
  goTo
})

watch(() => props.currentCfi, (newCfi) => {
  if (newCfi) {
    goTo(newCfi)
  }
})

onMounted(async () => {
  try {
    const arrayBuffer = base64ToArrayBuffer(props.bookData)
    book = ePub(arrayBuffer)
    
    await book.ready

    if (!viewerContainer.value) return
    
    rendition = book.renderTo(viewerContainer.value, {
      width: '100%',
      height: '100%',
      spread: 'none',
      flow: 'paginated'
    })

    await rendition.display()
    
    if (props.currentCfi) {
      await goTo(props.currentCfi)
    }
    
    emit('ready')
  } catch (error) {
    console.error('Failed to load book:', error)
  }
})

onUnmounted(() => {
  if (rendition) {
    rendition.destroy()
  }
})
</script>