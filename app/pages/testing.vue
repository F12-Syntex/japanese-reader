<template>
  <div class="min-h-screen bg-base-200 p-4">
    <div class="max-w-7xl mx-auto space-y-4">
      <!-- Controls -->
      <div class="flex gap-4 items-center bg-base-100 p-4 rounded-lg shadow">
        <input
          type="file"
          accept="application/pdf"
          @change="loadPDF"
          class="file-input file-input-bordered file-input-primary"
        />
        <div v-if="numPages > 0" class="flex gap-2 items-center">
          <button @click="prevPage" :disabled="currentPage <= 1" class="btn btn-sm">←</button>
          <span class="text-sm">{{ currentPage }} / {{ numPages }}</span>
          <button @click="nextPage" :disabled="currentPage >= numPages" class="btn btn-sm">→</button>
          <input 
            type="range" 
            v-model.number="zoom" 
            min="0.5" 
            max="3" 
            step="0.1" 
            class="range range-primary range-sm w-32"
          />
          <span class="text-sm">{{ Math.round(zoom * 100) }}%</span>
        </div>
      </div>

      <!-- Debug Info -->
      <div v-if="numPages > 0" class="bg-base-100 p-4 rounded-lg text-sm">
        <div>Page: {{ pageWidth }}x{{ pageHeight }}</div>
        <div>Text Items: {{ textItems.length }}</div>
        <div>Images: {{ pageImages.length }}</div>
      </div>

      <!-- Reconstructed Page -->
      <div 
        v-if="numPages > 0" 
        class="relative mx-auto shadow-xl bg-white"
        :style="{ 
          width: pageWidth * zoom + 'px', 
          height: pageHeight * zoom + 'px' 
        }"
      >
        <!-- Images Layer -->
        <img
          v-for="(img, idx) in pageImages"
          :key="`img-${idx}`"
          :src="img.src"
          :style="{
            position: 'absolute',
            left: img.x * zoom + 'px',
            top: img.y * zoom + 'px',
            width: img.width * zoom + 'px',
            height: img.height * zoom + 'px',
          }"
          class="pointer-events-none"
        />

        <!-- Interactive Text Layer -->
        <span
          v-for="(item, idx) in textItems"
          :key="`text-${idx}`"
          :style="item.style"
          class="absolute pointer-events-auto hover:bg-yellow-200/70 transition-colors cursor-pointer"
          @click="handleTextClick(item)"
        >
          {{ item.text }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const currentPage = ref(1)
const numPages = ref(0)
const zoom = ref(1)
const textItems = ref<any[]>([])
const pageImages = ref<any[]>([])
const pageWidth = ref(0)
const pageHeight = ref(0)

let pdfDoc: any = null
let pdfjsLib: any = null

onMounted(async () => {
  const pdfjs = await import('pdfjs-dist')
  
  pdfjsLib = pdfjs
  const worker = await import('pdfjs-dist/build/pdf.worker.mjs?url')
  pdfjsLib.GlobalWorkerOptions.workerSrc = worker.default
  
  console.log('Loaded PDF.js')
})

const loadPDF = async (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file || !pdfjsLib) return

  const arrayBuffer = await file.arrayBuffer()
  pdfDoc = await pdfjsLib.getDocument(arrayBuffer).promise
  numPages.value = pdfDoc.numPages
  currentPage.value = 1
  
  console.log('PDF loaded:', numPages.value, 'pages')
  
  await renderPage()
}

const renderPage = async () => {
  if (!pdfDoc) return

  console.log('Rendering page', currentPage.value)
  const page = await pdfDoc.getPage(currentPage.value)
  const viewport = page.getViewport({ scale: 1.0 })
  
  pageWidth.value = viewport.width
  pageHeight.value = viewport.height
  
  console.log('Viewport:', viewport.width, 'x', viewport.height)

  // Extract images
  await extractImages(page, viewport)
  
  // Extract text
  const textContent = await page.getTextContent()
  console.log('Text items:', textContent.items.length)
  extractText(textContent, viewport)
}

const extractImages = async (page: any, viewport: any) => {
  const images: any[] = []
  
  try {
    const ops = await page.getOperatorList()
    console.log('Operator list length:', ops.fnArray.length)
    
    let transformStack: number[][] = [[1, 0, 0, 1, 0, 0]]
    
    for (let i = 0; i < ops.fnArray.length; i++) {
      const fn = ops.fnArray[i]
      const args = ops.argsArray[i]
      
      // Track transform matrix changes
      if (fn === pdfjsLib.OPS.transform) {
        const current = transformStack[transformStack.length - 1]
        transformStack.push(multiplyMatrices(current, args))
      } else if (fn === pdfjsLib.OPS.save) {
        transformStack.push([...transformStack[transformStack.length - 1]])
      } else if (fn === pdfjsLib.OPS.restore) {
        if (transformStack.length > 1) transformStack.pop()
      } else if (fn === pdfjsLib.OPS.paintImageXObject || fn === pdfjsLib.OPS.paintInlineImageXObject) {
        const imageName = args[0]
        const transform = transformStack[transformStack.length - 1]
        
        console.log('Found image:', imageName, 'transform:', transform)
        
        try {
          const image = await new Promise<any>((resolve) => {
            page.objs.get(imageName, resolve)
          })

          if (!image) {
            console.log('Image not found:', imageName)
            continue
          }

          const canvas = document.createElement('canvas')
          const ctx = canvas.getContext('2d')!
          canvas.width = image.width
          canvas.height = image.height
          
          // Handle different image data formats
          if (image.bitmap) {
            // Already a bitmap
            ctx.drawImage(image.bitmap, 0, 0)
          } else if (image.data) {
            // Raw pixel data
            const imageData = new ImageData(
              new Uint8ClampedArray(image.data),
              image.width,
              image.height
            )
            ctx.putImageData(imageData, 0, 0)
          } else {
            console.log('Unknown image format:', image)
            continue
          }
          
          // Calculate position from transform matrix
          const scaleX = Math.sqrt(transform[0] * transform[0] + transform[1] * transform[1])
          const scaleY = Math.sqrt(transform[2] * transform[2] + transform[3] * transform[3])
          
          const imgData = {
            src: canvas.toDataURL('image/png'),
            x: transform[4],
            y: viewport.height - transform[5] - scaleY,
            width: scaleX,
            height: scaleY
          }
          
          images.push(imgData)
          console.log('Image added:', imgData.x, imgData.y, imgData.width, imgData.height)
          
        } catch (error) {
          console.error('Error processing image:', imageName, error)
        }
      }
    }
  } catch (error) {
    console.error('Error extracting images:', error)
  }
  
  console.log('Total images:', images.length)
  pageImages.value = images
}

const multiplyMatrices = (m1: number[], m2: number[]) => {
  return [
    m1[0] * m2[0] + m1[2] * m2[1],
    m1[1] * m2[0] + m1[3] * m2[1],
    m1[0] * m2[2] + m1[2] * m2[3],
    m1[1] * m2[2] + m1[3] * m2[3],
    m1[0] * m2[4] + m1[2] * m2[5] + m1[4],
    m1[1] * m2[4] + m1[3] * m2[5] + m1[5]
  ]
}

const extractText = (textContent: any, viewport: any) => {
  const items: any[] = []

  for (const item of textContent.items) {
    if (!item.str || !item.str.trim()) continue
    
    const tx = item.transform
    const fontSize = Math.sqrt(tx[2] * tx[2] + tx[3] * tx[3])
    const rotation = Math.atan2(tx[1], tx[0])
    
    // Convert from bottom-left to top-left origin
    const x = tx[4]
    const y = viewport.height - tx[5]
    
    items.push({
      text: item.str,
      baseX: x,
      baseY: y - fontSize,
      baseFontSize: fontSize,
      baseRotation: rotation,
      fontName: item.fontName,
      style: {
        left: x * zoom.value + 'px',
        top: (y - fontSize) * zoom.value + 'px',
        fontSize: fontSize * zoom.value + 'px',
        transform: `rotate(${rotation}rad)`,
        transformOrigin: '0 0',
        whiteSpace: 'nowrap',
        lineHeight: '1',
        fontFamily: 'serif',
      }
    })
  }

  console.log('Extracted text items:', items.length)
  textItems.value = items
}

const handleTextClick = (item: any) => {
  console.log('Clicked:', item.text)
}

const prevPage = async () => {
  if (currentPage.value > 1) {
    currentPage.value--
    await renderPage()
  }
}

const nextPage = async () => {
  if (currentPage.value < numPages.value) {
    currentPage.value++
    await renderPage()
  }
}

watch(zoom, () => {
  // Update text positions
  textItems.value = textItems.value.map(item => ({
    ...item,
    style: {
      ...item.style,
      left: item.baseX * zoom.value + 'px',
      top: item.baseY * zoom.value + 'px',
      fontSize: item.baseFontSize * zoom.value + 'px',
    }
  }))
})
</script>