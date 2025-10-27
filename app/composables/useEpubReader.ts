import ePub, { Book, type NavItem, Rendition } from 'epubjs'

interface EpubPage {
  content: string
  chapterTitle: string
  chapterHref: string
  cfi: string
}

export const useEpubReader = () => {
  const book = ref<Book | null>(null)
  const rendition = ref<Rendition | null>(null)
  const pages = ref<string[]>([])
  const currentPageIndex = ref(0)
  const toc = ref<NavItem[]>([])
  const isLoading = ref(false)
  const progress = ref(0)
  const totalPages = computed(() => pages.value.length)
  const currentPage = ref<EpubPage | null>(null)
  const canGoNext = ref(false)
  const canGoPrev = ref(false)

  const base64ToArrayBuffer = (base64: string): ArrayBuffer => {
    const binaryString = atob(base64)
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }
    return bytes.buffer
  }

  const loadEpub = async (pathOrBase64: string) => {
    isLoading.value = true
    progress.value = 0

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

      const container = document.createElement('div')
      container.style.width = '800px'
      container.style.height = '600px'
      container.style.position = 'absolute'
      container.style.visibility = 'hidden'
      document.body.appendChild(container)

      rendition.value = book.value.renderTo(container, {
        width: 800,
        height: 600,
        spread: 'none',
        flow: 'paginated'
      })

      await rendition.value.display()

      const spine = book.value.spine as any
      const locations = await book.value.locations.generate(1600)
      pages.value = locations

      document.body.removeChild(container)

      if (pages.value.length > 0) {
        await goToPage(0)
      }

      progress.value = 100
    } catch (error) {
      console.error('Failed to load epub:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  const extractPageContent = async (cfi: string): Promise<EpubPage> => {
    if (!book.value || !rendition.value) {
      return {
        content: '',
        chapterTitle: '',
        chapterHref: '',
        cfi
      }
    }

    const range = await book.value.getRange(cfi)
    if (!range) {
      return {
        content: '',
        chapterTitle: '',
        chapterHref: '',
        cfi
      }
    }

    const container = range.commonAncestorContainer
    const element = container.nodeType === Node.ELEMENT_NODE 
      ? container as HTMLElement 
      : container.parentElement

    if (!element) {
      return {
        content: '',
        chapterTitle: '',
        chapterHref: '',
        cfi
      }
    }

    const section = book.value.spine.get(cfi)
    const chapterHref = section?.href || ''
    const chapterTitle = toc.value.find(t => t.href === chapterHref)?.label || ''

    const clonedElement = element.cloneNode(true) as HTMLElement
    
    const images = clonedElement.querySelectorAll('img')
    for (const img of Array.from(images)) {
      const src = img.getAttribute('src')
      if (src && !src.startsWith('http') && !src.startsWith('data:')) {
        try {
          let url: string
          try {
            // Use single-argument resolve to satisfy typings
            url = book.value.resolve(src)
          } catch {
            // Fallback: resolve relative to the chapterHref or current location
            url = new URL(src, chapterHref || window.location.href).toString()
          }
          img.setAttribute('src', url)
        } catch (e) {
          console.error('Failed to resolve image:', src, e)
        }
      }
    }

    const content = clonedElement.innerHTML || clonedElement.textContent || ''

    return {
      content,
      chapterTitle,
      chapterHref,
      cfi
    }
  }

  const nextPage = async () => {
    if (currentPageIndex.value < pages.value.length - 1) {
      await goToPage(currentPageIndex.value + 1)
    }
  }

  const prevPage = async () => {
    if (currentPageIndex.value > 0) {
      await goToPage(currentPageIndex.value - 1)
    }
  }

  const goToPage = async (index: number) => {
    if (index >= 0 && index < pages.value.length) {
      currentPageIndex.value = index
      const cfi = pages.value[index]
      if (cfi) {
        currentPage.value = await extractPageContent(cfi)
        canGoNext.value = index < pages.value.length - 1
        canGoPrev.value = index > 0
      }
    }
  }

  const goToChapter = async (href: string) => {
    if (!book.value) return
    
    const section = book.value.spine.get(href)
    if (!section) return

    const cfi = section.cfiBase
    const pageIndex = pages.value.findIndex(p => p.startsWith(cfi))
    
    if (pageIndex !== -1) {
      await goToPage(pageIndex)
    }
  }

  const destroy = () => {
    if (rendition.value) {
      rendition.value.destroy()
      rendition.value = null
    }
    if (book.value) {
      book.value.destroy()
      book.value = null
    }
    pages.value = []
    currentPageIndex.value = 0
    currentPage.value = null
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