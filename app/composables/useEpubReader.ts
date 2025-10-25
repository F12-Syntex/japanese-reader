import ePub, { Book, type NavItem } from 'epubjs'

interface EpubPage {
  content: string
  chapterTitle: string
  chapterHref: string
  pageNumber: number
  isChapterStart: boolean
}

export const useEpubReader = () => {
  const book = ref<Book | null>(null)
  const pages = ref<EpubPage[]>([])
  const currentPageIndex = ref(0)
  const toc = ref<NavItem[]>([])
  const isLoading = ref(false)
  const progress = ref(0)
  const totalPages = computed(() => pages.value.length)
  const currentPage = computed(() => pages.value[currentPageIndex.value])
  const canGoNext = computed(() => currentPageIndex.value < totalPages.value - 1)
  const canGoPrev = computed(() => currentPageIndex.value > 0)

  const CHARS_PER_PAGE = 400

  const base64ToArrayBuffer = (base64: string): ArrayBuffer => {
    const binaryString = atob(base64)
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }
    return bytes.buffer
  }

  const splitIntoPages = (text: string, chapterTitle: string, chapterHref: string, startPageNumber: number, isChapterStart: boolean): EpubPage[] => {
    const cleanText = text.trim()
    if (!cleanText) return []

    const pageList: EpubPage[] = []
    
    for (let i = 0; i < cleanText.length; i += CHARS_PER_PAGE) {
      const chunk = cleanText.slice(i, i + CHARS_PER_PAGE)
      pageList.push({
        content: chunk,
        chapterTitle,
        chapterHref,
        pageNumber: startPageNumber + pageList.length,
        isChapterStart: isChapterStart && i === 0
      })
    }
    
    return pageList
  }

  const loadEpub = async (pathOrBase64: string) => {
    isLoading.value = true
    progress.value = 0
    pages.value = []
    currentPageIndex.value = 0

    try {
      const isBase64 = !pathOrBase64.startsWith('http') && !pathOrBase64.startsWith('/')
      
      if (isBase64) {
        const arrayBuffer = base64ToArrayBuffer(pathOrBase64)
        book.value = ePub(arrayBuffer)
      } else {
        book.value = ePub(pathOrBase64)
      }

      await book.value.ready

      const navigation = await book.value.loaded.navigation
      toc.value = navigation.toc

      const spine = await book.value.loaded.spine
      const spineItems = Array.isArray(spine) ? spine : (spine as any).spineItems ?? []

      let pageCounter = 0

      for (let i = 0; i < spineItems.length; i++) {
        const item = spineItems[i]
        if (!item) continue

        const doc = await book.value.load(item.href) as Document
        const text = doc.body?.textContent || ''
        
        const chapterTitle = toc.value.find(t => t.href === item.href)?.label || `Chapter ${i + 1}`
        
        const chapterPages = splitIntoPages(text, chapterTitle, item.href, pageCounter, true)
        pages.value.push(...chapterPages)
        
        pageCounter += chapterPages.length
        progress.value = Math.round(((i + 1) / spineItems.length) * 100)
      }
    } catch (error) {
      console.error('Failed to load epub:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  const nextPage = () => {
    if (canGoNext.value) {
      currentPageIndex.value++
    }
  }

  const prevPage = () => {
    if (canGoPrev.value) {
      currentPageIndex.value--
    }
  }

  const goToPage = (index: number) => {
    if (index >= 0 && index < totalPages.value) {
      currentPageIndex.value = index
    }
  }

  const goToChapter = (href: string) => {
    const pageIndex = pages.value.findIndex(p => p.chapterHref === href && p.isChapterStart)
    if (pageIndex !== -1) {
      currentPageIndex.value = pageIndex
    }
  }

  const destroy = () => {
    if (book.value) {
      book.value.destroy()
      book.value = null
    }
    pages.value = []
    currentPageIndex.value = 0
  }

  return {
    book,
    pages,
    currentPage,
    currentPageIndex,
    totalPages,
    toc,
    isLoading,
    progress,
    canGoNext,
    canGoPrev,
    loadEpub,
    nextPage,
    prevPage,
    goToPage,
    goToChapter,
    destroy
  }
}