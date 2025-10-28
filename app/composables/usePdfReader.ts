export const usePdfReader = () => {
  const currentPageIndex = ref(0)
  const totalPages = ref(0)
  const isLoading = ref(false)
  const canGoNext = computed(() => currentPageIndex.value < totalPages.value - 1)
  const canGoPrev = computed(() => currentPageIndex.value > 0)
  const currentPageText = ref('')
  const currentPageImage = ref('')

  let pdfDoc: any = null
  let pdfjsLib: any = null

  const loadPdf = async (base64Data: string) => {
    isLoading.value = true
    
    try {
      if (!pdfjsLib) {
        pdfjsLib = await import('pdfjs-dist')
        const pdfjsWorker = await import('pdfjs-dist/build/pdf.worker.mjs?url')
        pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker.default
      }

      const binaryString = atob(base64Data)
      const len = binaryString.length
      const bytes = new Uint8Array(len)
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i)
      }

      pdfDoc = await pdfjsLib.getDocument({ data: bytes }).promise
      totalPages.value = pdfDoc.numPages
      
      await goToPage(0)
    } catch (error) {
      console.error('Error loading PDF:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  const renderPageAsImage = async (pageNum: number) => {
    if (!pdfDoc) return ''

    try {
      const page = await pdfDoc.getPage(pageNum)
      const viewport = page.getViewport({ scale: 2.0 })
      const canvas = document.createElement('canvas')
      const context = canvas.getContext('2d')
      
      if (!context) return ''
      
      canvas.width = viewport.width
      canvas.height = viewport.height
      
      await page.render({ canvasContext: context, viewport }).promise
      return canvas.toDataURL()
    } catch (error) {
      console.error('Error rendering page:', error)
      return ''
    }
  }

  const extractPageText = async (pageNum: number) => {
    if (!pdfDoc) return ''

    try {
      const page = await pdfDoc.getPage(pageNum)
      const textContent = await page.getTextContent()
      
      return textContent.items
        .map((item: any) => item.str)
        .join(' ')
        .trim()
    } catch (error) {
      console.error('Error extracting text:', error)
      return ''
    }
  }

  const goToPage = async (index: number) => {
    if (index < 0 || index >= totalPages.value) return

    isLoading.value = true
    currentPageIndex.value = index

    try {
      const pageNumber = index + 1
      currentPageImage.value = await renderPageAsImage(pageNumber)
      currentPageText.value = await extractPageText(pageNumber)
    } catch (error) {
      console.error('Error loading page:', error)
    } finally {
      isLoading.value = false
    }
  }

  const nextPage = async () => {
    if (canGoNext.value) {
      await goToPage(currentPageIndex.value + 1)
    }
  }

  const prevPage = async () => {
    if (canGoPrev.value) {
      await goToPage(currentPageIndex.value - 1)
    }
  }

  const destroy = () => {
    pdfDoc = null
    currentPageIndex.value = 0
    totalPages.value = 0
    currentPageText.value = ''
    currentPageImage.value = ''
  }

  return {
    currentPageIndex,
    totalPages,
    isLoading,
    canGoNext,
    canGoPrev,
    currentPageText,
    currentPageImage,
    loadPdf,
    nextPage,
    prevPage,
    goToPage,
    destroy
  }
}