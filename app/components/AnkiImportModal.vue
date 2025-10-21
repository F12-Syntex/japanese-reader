<template>
  <div v-if="modelValue" class="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4" @click.self="closeModal">
    <div class="bg-base-100 rounded-xl shadow-2xl w-full max-w-md">
      <div class="p-6 border-b border-base-300">
        <div class="flex items-start justify-between">
          <div>
            <h2 class="text-2xl font-bold">Import Anki Deck</h2>
            <p class="text-sm text-base-content/60 mt-1">Upload your .colpkg or .apkg file</p>
          </div>
          <button @click="closeModal" class="btn btn-ghost btn-sm btn-circle">
            <IconX class="w-5 h-5" />
          </button>
        </div>
      </div>

      <div class="p-6">
        <div v-if="!isLoading && !importSuccess" class="space-y-4">
          <div 
            class="border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer"
            :class="isDragging 
              ? 'border-primary bg-primary/10' 
              : 'border-base-300 hover:border-primary/50'"
            @click="triggerFileInput"
            @dragover.prevent="isDragging = true"
            @dragleave.prevent="isDragging = false"
            @drop.prevent="handleDrop"
          >
            <IconUpload class="w-12 h-12 mx-auto mb-3 text-base-content/40" />
            <p class="font-semibold mb-1">Click to upload or drag and drop</p>
            <p class="text-sm text-base-content/60">.apkg or .colpkg files</p>
            <input 
              ref="fileInput"
              type="file" 
              accept=".apkg,.colpkg"
              class="hidden"
              @change="handleFileSelect"
            />
          </div>

          <div v-if="error" class="alert alert-error shadow-lg">
            <IconAlertCircle class="w-5 h-5 flex-shrink-0" />
            <span>{{ error }}</span>
          </div>

          <div class="alert alert-info shadow-lg">
            <IconInfo class="w-5 h-5 flex-shrink-0" />
            <div class="text-sm">
              <p class="font-semibold">What gets imported:</p>
              <p class="text-xs opacity-90">Only cards you've reviewed (learned words). New/suspended cards are skipped.</p>
            </div>
          </div>
        </div>

        <div v-if="isLoading" class="text-center py-8 space-y-3">
          <span class="loading loading-spinner loading-lg mx-auto block"></span>
          <p class="text-base-content/70 font-medium">Processing Anki deck...</p>
          <p class="text-xs text-base-content/50">This may take a moment for large decks</p>
        </div>

        <div v-if="importSuccess" class="text-center py-8 space-y-4">
          <div class="w-16 h-16 bg-success/20 rounded-full flex items-center justify-center mx-auto">
            <IconCheck class="w-8 h-8 text-success" />
          </div>
          <div>
            <h3 class="text-xl font-bold">Import Successful!</h3>
            <p class="text-sm text-base-content/70 mt-2">
              Imported {{ totalWords?.toLocaleString() }} learned words
            </p>
            <p class="text-xs text-base-content/50 mt-1">
              These words will be used to generate personalized content
            </p>
          </div>
          <button @click="closeModal" class="btn btn-primary w-full mt-4">
            Done
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import IconX from '~icons/lucide/x'
import IconUpload from '~icons/lucide/upload'
import IconCheck from '~icons/lucide/check'
import IconAlertCircle from '~icons/lucide/alert-circle'
import IconInfo from '~icons/lucide/info'

interface Props {
  modelValue: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const { processAnkiFile, isLoading, error } = useAnki()

const fileInput = ref<HTMLInputElement | null>(null)
const isDragging = ref(false)
const importSuccess = ref(false)
const totalWords = ref<number>(0)

const closeModal = (): void => {
  emit('update:modelValue', false)
  setTimeout(() => {
    importSuccess.value = false
    totalWords.value = 0
  }, 300)
}

const triggerFileInput = (): void => {
  fileInput.value?.click()
}

const handleFileSelect = async (event: Event): Promise<void> => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    await processFile(file)
  }
}

const handleDrop = async (event: DragEvent): Promise<void> => {
  isDragging.value = false
  const file = event.dataTransfer?.files?.[0]
  if (file && (file.name.endsWith('.apkg') || file.name.endsWith('.colpkg'))) {
    await processFile(file)
  }
}

const processFile = async (file: File): Promise<void> => {
  const result = await processAnkiFile(file)
  if (result?.success) {
    importSuccess.value = true
    totalWords.value = result.totalWords ?? 0
  }
}
</script>