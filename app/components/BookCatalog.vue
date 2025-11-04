<template>
  <div class="container mx-auto p-4 flex-1 overflow-y-auto">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-3xl font-bold">PDF Library</h1>
      <div class="flex gap-2">
        <button
          v-if="supportsFileSystemAccess"
          @click="handleFileSystemAccess"
          class="btn btn-primary"
        >
          Open PDF Files (Persistent)
        </button>
        <input
          type="file"
          accept=".pdf"
          multiple
          @change="handleFileUpload"
          ref="fileInput"
          class="file-input file-input-bordered file-input-primary w-full max-w-xs"
        />
      </div>
    </div>

    <div v-if="loading" class="flex justify-center items-center p-8">
      <span class="loading loading-spinner loading-lg"></span>
    </div>

    <div v-if="!loading && booksStore.books.length === 0" class="alert alert-info">
      <span>No PDFs imported yet. Upload some PDF files to get started.</span>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      <div
        v-for="(book, index) in booksStore.books"
        :key="index"
        class="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow cursor-pointer"
        @click="openBook(book)"
      >
        <figure class="px-4 pt-4">
          <img
            v-if="book.cover"
            :src="book.cover"
            :alt="book.title"
            class="rounded-xl h-64 w-full object-cover"
          />
          <div v-else class="rounded-xl h-64 w-full bg-base-300 flex items-center justify-center">
            <span class="text-4xl">📄</span>
          </div>
        </figure>
        <div class="card-body">
          <h2 class="card-title text-lg">{{ book.title }}</h2>
          <p class="text-sm text-base-content/70">{{ book.author }}</p>
          <div class="card-actions justify-end mt-2">
            <button
              @click.stop="handleRemoveBook(index, book)"
              class="btn btn-error btn-sm"
            >
              Remove
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useBooksStore, type BookData } from '~/stores/useBooksStore'
import { saveFileHandle, generateBookId, removeFileHandle, getFileHandle } from '~/utils/fileHandleStorage'

definePageMeta({
  ssr: false
})

const booksStore = useBooksStore()
const fileInput = ref<HTMLInputElement | null>(null)
const loading = ref(false)

// Check if File System Access API is supported
const supportsFileSystemAccess = ref(false)

let pdfjsLib: any = null

onMounted(async () => {
  // Check if File System Access API is available
  supportsFileSystemAccess.value = 'showOpenFilePicker' in window
  
  try {
    pdfjsLib = await import('pdfjs-dist')
    const pdfjsWorker = await import('pdfjs-dist/build/pdf.worker.mjs?url')
    pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker.default
  } catch (error) {
    console.error('Failed to load PDF.js:', error)
  }
  
  // Restore file handles from IndexedDB
  if (supportsFileSystemAccess.value) {
    for (const book of booksStore.books) {
      if (book.bookId && !book.fileHandle) {
        const fileHandle = await getFileHandle(book.bookId)
        if (fileHandle) {
          book.fileHandle = fileHandle
        }
      }
    }
  }
})

const processFile = async (file: File, fileHandle?: FileSystemFileHandle) => {
  if (!pdfjsLib) return

  const arrayBuffer = await file.arrayBuffer()
  const arrayBufferCopy = arrayBuffer.slice(0)
  
  const pdf = await pdfjsLib.getDocument({ data: arrayBufferCopy }).promise
  
  let coverImage = ''
  try {
    const page = await pdf.getPage(1)
    const viewport = page.getViewport({ scale: 1.0 })
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')
    
    if (context) {
      canvas.width = viewport.width
      canvas.height = viewport.height
      await page.render({ canvasContext: context, viewport }).promise
      coverImage = canvas.toDataURL()
    }
  } catch (error) {
    console.error('Error generating cover:', error)
  }
  
  const base64 = arrayBufferToBase64(arrayBuffer)
  const title = file.name.replace('.pdf', '')
  const bookId = generateBookId(file.name, title)
  
  const bookData: BookData = {
    path: base64, // Keep for backward compatibility
    fileHandle: fileHandle || null,
    fileName: file.name,
    bookId,
    title,
    author: 'Unknown Author',
    cover: coverImage
  }
  
  // Save file handle to IndexedDB if using File System Access API
  if (fileHandle) {
    await saveFileHandle(bookId, fileHandle)
  }
  
  booksStore.addBook(bookData)
}

const handleFileSystemAccess = async () => {
  if (!pdfjsLib || !('showOpenFilePicker' in window)) return
  
  loading.value = true
  
  try {
    const fileHandles = await (window as any).showOpenFilePicker({
      types: [{
        description: 'PDF Files',
        accept: {
          'application/pdf': ['.pdf']
        }
      }],
      multiple: true
    })
    
    for (const fileHandle of fileHandles) {
      const file = await fileHandle.getFile()
      await processFile(file, fileHandle)
    }
  } catch (error: any) {
    if (error.name !== 'AbortError') {
      console.error('Error accessing files:', error)
    }
  } finally {
    loading.value = false
  }
}

const handleFileUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const files = target.files
  
  if (!files || !pdfjsLib) return
  
  loading.value = true
  
  try {
    for (const file of Array.from(files)) {
      await processFile(file)
    }
  } catch (error) {
    console.error('Error processing PDFs:', error)
  } finally {
    loading.value = false
    if (fileInput.value) {
      fileInput.value.value = ''
    }
  }
}

const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
  let binary = ''
  const bytes = new Uint8Array(buffer)
  const len = bytes.byteLength
  for (let i = 0; i < len; i++) {
    const byte = bytes[i] ?? 0
    binary += String.fromCharCode(byte)
  }
  return btoa(binary)
}

const handleRemoveBook = async (index: number, book: BookData) => {
  // Remove file handle from IndexedDB if it exists
  if (book.bookId) {
    await removeFileHandle(book.bookId)
  }
  booksStore.removeBook(index)
}

const openBook = (book: BookData) => {
  booksStore.setCurrentBook(book)
  navigateTo('/books/reader')
}
</script>