import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface BookData {
  path: string // base64 data (for backward compatibility)
  fileHandle?: FileSystemFileHandle | null // File System Access API handle
  fileName?: string // Original file name for permission re-request
  bookId?: string // Unique identifier for IndexedDB storage
  title: string
  author: string
  cover: string
}

export const useBooksStore = defineStore(
  'books',
  () => {
    const books = ref<BookData[]>([])
    const currentBook = ref<BookData | null>(null)
    const lastParsedRange = ref<{ start: string; end: string } | null>(null)

    function addBook(book: BookData) {
      books.value.push(book)
    }

    function removeBook(index: number) {
      books.value.splice(index, 1)
    }

    function setCurrentBook(book: BookData | null) {
      currentBook.value = book
      lastParsedRange.value = null
    }

    function setLastParsedRange(range: { start: string; end: string } | null) {
      lastParsedRange.value = range
    }

    function clear() {
      books.value = []
      currentBook.value = null
      lastParsedRange.value = null
    }

    return {
      books,
      currentBook,
      lastParsedRange,
      addBook,
      removeBook,
      setCurrentBook,
      setLastParsedRange,
      clear,
    }
  },
  {
    persist: {
      serializer: {
        serialize: (value: any) => {
          // Serialize books but exclude file handles (they can't be serialized)
          const serializable = {
            ...value,
            books: value.books.map((book: BookData) => ({
              ...book,
              fileHandle: undefined, // Don't serialize file handles
            })),
          }
          return JSON.stringify(serializable)
        },
        deserialize: (value: string) => {
          const parsed = JSON.parse(value)
          // File handles will be undefined after deserialization
          return parsed
        },
      },
    },
  }
)