<template>
  <div v-if="modelValue" class="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4" @click.self="closeModal">
    <div class="bg-base-100 rounded-lg shadow-xl w-full max-w-md">
      <div class="p-6">
        <div class="flex items-start justify-between mb-6">
          <div>
            <h2 class="text-2xl font-bold mb-2">Import Anki Deck</h2>
            <p class="text-sm text-base-content/70">Upload your .colpkg or .apkg file</p>
          </div>
          <button @click="closeModal" class="btn btn-ghost btn-sm btn-circle">
            <IconX class="w-5 h-5" />
          </button>
        </div>

        <div v-if="!isLoading && !importSuccess" class="space-y-4">
          <div 
            class="border-2 border-dashed border-base-300 rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer"
            @click="triggerFileInput"
            @dragover.prevent="isDragging = true"
            @dragleave.prevent="isDragging = false"
            @drop.prevent="handleDrop"
            :class="{ 'border-primary bg-primary/5': isDragging }"
          >
            <IconUpload class="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p class="font-medium mb-2">Click to upload or drag and drop</p>
            <p class="text-sm text-base-content/60">.apkg or .colpkg files</p>
            <input 
              ref="fileInput"
              type="file" 
              accept=".apkg,.colpkg"
              class="hidden"
              @change="handleFileSelect"
            />
          </div>

          <div v-if="error" class="alert alert-error">
            <IconAlertCircle class="w-5 h-5" />
            <span>{{ error }}</span>
          </div>

          <div class="alert alert-info">
            <IconInfo class="w-5 h-5" />
            <div class="text-sm">
              <p class="font-bold mb-1">What gets imported:</p>
              <p>Only cards you've reviewed (learned words). New/suspended cards are skipped.</p>
            </div>
          </div>
        </div>

        <div v-if="isLoading" class="text-center py-8">
          <div class="loading loading-spinner loading-lg mx-auto mb-4"></div>
          <p class="text-base-content/70">Processing Anki deck...</p>
          <p class="text-sm text-base-content/50 mt-2">This may take a moment for large decks</p>
        </div>

        <div v-if="importSuccess" class="text-center py-8">
          <div class="w-16 h-16 bg-success/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <IconCheck class="w-8 h-8 text-success" />
          </div>
          <h3 class="text-xl font-bold mb-2">Import Successful!</h3>
          <p class="text-base-content/70 mb-2">
            Imported {{ totalWords?.toLocaleString() }} learned words
          </p>
          <p class="text-sm text-base-content/50 mb-6">
            These words will be used to generate personalized content
          </p>
          <button @click="closeModal" class="btn btn-primary">
            Done
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import IconX from '~icons/lucide/x'
import IconUpload from '~icons/lucide/upload'
import IconCheck from '~icons/lucide/check'
import IconAlertCircle from '~icons/lucide/alert-circle'
import IconInfo from '~icons/lucide/info'

const props = defineProps({
  modelValue: Boolean
})

const emit = defineEmits(['update:modelValue'])

const { processAnkiFile, isLoading, error } = useAnki()

const fileInput = ref(null)
const isDragging = ref(false)
const importSuccess = ref(false)
const totalWords = ref(0)

const closeModal = () => {
  emit('update:modelValue', false)
  setTimeout(() => {
    importSuccess.value = false
    totalWords.value = 0
  }, 300)
}

const triggerFileInput = () => {
  fileInput.value?.click()
}

const handleFileSelect = async (event) => {
  const file = event.target.files?.[0]
  if (file) {
    await processFile(file)
  }
}

const handleDrop = async (event) => {
  isDragging.value = false
  const file = event.dataTransfer.files?.[0]
  if (file && (file.name.endsWith('.apkg') || file.name.endsWith('.colpkg'))) {
    await processFile(file)
  }
}

const processFile = async (file) => {
  const result = await processAnkiFile(file)
  if (result.success) {
    importSuccess.value = true
    totalWords.value = result.totalWords
  }
}
</script>