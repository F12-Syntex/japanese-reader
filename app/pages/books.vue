<template>
  <div class="h-full flex flex-col">
    <div v-if="!booksStore.currentBook" class="container mx-auto p-4 flex-1 overflow-y-auto">
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-3xl font-bold">Books Library</h1>
        <input
          type="file"
          accept=".epub"
          multiple
          @change="handleFileUpload"
          ref="fileInput"
          class="file-input file-input-bordered file-input-primary w-full max-w-xs"
        />
      </div>

      <div v-if="booksStore.books.length === 0" class="alert alert-info">
        <span>No books imported yet. Upload some EPUB files to get started.</span>
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
              <span class="text-4xl">📖</span>
            </div>
          </figure>
          <div class="card-body">
            <h2 class="card-title text-lg">{{ book.title }}</h2>
            <p class="text-sm text-base-content/70">{{ book.author }}</p>
            <div class="card-actions justify-end mt-2">
              <button
                @click.stop="booksStore.removeBook(index)"
                class="btn btn-error btn-sm"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <BookReader v-else @close="closeBook" />
  </div>
</template>

<script setup lang="ts">
import { useBooksStore, type BookData } from '~/stores/useBooksStore'
import ePub from 'epubjs'
import type { Book } from 'epubjs'

definePageMeta({
  layout: 'default'
})

const booksStore = useBooksStore()
const fileInput = ref<HTMLInputElement | null>(null)

const handleFileUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const files = target.files
  
  if (files) {
    for (const file of Array.from(files)) {
      const arrayBuffer = await file.arrayBuffer()
      const book: Book = ePub(arrayBuffer)
      
      await book.ready
      
      const metadata = await book.loaded.metadata
      const cover = await book.coverUrl()
      
      const base64 = arrayBufferToBase64(arrayBuffer)
      
      const bookData: BookData = {
        path: base64,
        title: metadata.title || 'Unknown Title',
        author: metadata.creator || 'Unknown Author',
        cover: cover || ''
      }
      
      booksStore.addBook(bookData)
    }
    
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

const openBook = (book: BookData) => {
  booksStore.setCurrentBook(book)
}

const closeBook = () => {
  booksStore.setCurrentBook(null)
}
</script>