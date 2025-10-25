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

    function addBook(book: BookData) {
      books.value.push(book)
    }

    function removeBook(index: number) {
      books.value.splice(index, 1)
    }

    function setCurrentBook(book: BookData | null) {
      currentBook.value = book
    }

    function clear() {
      books.value = []
      currentBook.value = null
    }

    return {
      books,
      currentBook,
      addBook,
      removeBook,
      setCurrentBook,
      clear,
    }
  },
  {
    persist: true,
  }
)