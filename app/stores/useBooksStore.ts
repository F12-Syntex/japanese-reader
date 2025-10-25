import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface BookData {
  path: string
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
    persist: true,
  }
)