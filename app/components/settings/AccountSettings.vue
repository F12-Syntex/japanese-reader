<template>
  <div class="space-y-6 px-2 md:px-0">
    <div class="card bg-base-200/50 border border-base-300">
      <div class="card-body p-4 md:p-6">
        <h3 class="text-base font-bold flex items-center gap-2 mb-4">
          <IconKey class="w-5 h-5" />
          OpenAI API Key
        </h3>
        <div class="space-y-4 mt-4">
          <label class="input input-bordered flex items-center gap-2 group">
            <input
              v-model="apiKey"
              :type="showKey ? 'text' : 'password'"
              class="grow font-mono text-sm"
              placeholder="sk-proj-..."
            />
            <button
              type="button"
              @click="showKey = !showKey"
              class="btn btn-ghost btn-xs"
            >
              <IconEye v-if="!showKey" class="w-4 h-4" />
              <IconEyeOff v-else class="w-4 h-4" />
            </button>
          </label>

          <div class="flex gap-2">
            <button
              @click="saveApiKey"
              class="btn btn-primary flex-1"
              :disabled="!apiKey || isSaving"
              :class="{ 'loading': isSaving }"
            >
              <IconSave class="w-4 h-4" />
              Save
            </button>
            <button
              @click="testApiKey"
              class="btn btn-outline flex-1"
              :disabled="!apiKey || isTesting"
              :class="{ 'loading': isTesting }"
            >
              <IconZap class="w-4 h-4" />
              Test
            </button>
            <button
              v-if="apiKey"
              @click="clearApiKey"
              class="btn btn-ghost"
            >
              <IconX class="w-4 h-4" />
            </button>
          </div>

          <div v-if="testResult" :class="['alert', testResult.success ? 'alert-success' : 'alert-error']">
            <span v-if="testResult.success">
              <IconCheck class="w-4 h-4" />
            </span>
            <span v-else>
              <IconAlertCircle class="w-4 h-4" />
            </span>
            <span>{{ testResult.message }}</span>
          </div>

          <div v-if="!apiKey" class="text-xs text-base-content/50 flex items-center gap-2">
            <IconShield class="w-3 h-3" />
            Stored locally in your browser
          </div>
        </div>
      </div>
    </div>

    <div class="card bg-base-200/50 border border-base-300">
      <div class="card-body p-4 md:p-6">
        <h3 class="text-base font-bold flex items-center gap-2 mb-4">
          <IconDatabase class="w-5 h-5" />
          Anki deck
        </h3>
        <p class="text-sm text-base-content/60">
          {{ knownWords.size > 0 ? `${knownWords.size.toLocaleString()} words imported` : 'import your japanese anki deck.' }}
        </p>
        <div class="card-actions justify-end gap-2 mt-4">
          <button
            @click="showAnkiImport = true"
            class="btn btn-primary btn-sm"
          >
            <IconUpload class="w-4 h-4" />
            Import
          </button>
          <button
            v-if="knownWords.size > 0"
            @click="emit('openAnkiData')"
            class="btn btn-ghost btn-sm"
          >
            <IconEye class="w-4 h-4" />
            View
          </button>
          <button
            v-if="knownWords.size > 0"
            @click="handleClearAnki"
            class="btn btn-error btn-sm"
          >
            <IconTrash class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>

    <ClientOnly>
      <AnkiImportModal v-model="showAnkiImport" />
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
import IconKey from '~icons/lucide/key'
import IconSave from '~icons/lucide/save'
import IconCheck from '~icons/lucide/check'
import IconX from '~icons/lucide/x'
import IconEye from '~icons/lucide/eye'
import IconEyeOff from '~icons/lucide/eye-off'
import IconShield from '~icons/lucide/shield'
import IconZap from '~icons/lucide/zap'
import IconAlertCircle from '~icons/lucide/alert-circle'
import IconDatabase from '~icons/lucide/database'
import IconTrash from '~icons/lucide/trash-2'
import IconUpload from '~icons/lucide/upload'
import { ref, onMounted, watch } from 'vue'
import { useAnki } from '~/composables/useAnki'

const emit = defineEmits<{
  openAnkiData: []
}>()

const { knownWords, clearAnkiData, loadFromStorage } = useAnki()

const apiKey = ref<string>('')
const showKey = ref<boolean>(false)
const isSaving = ref<boolean>(false)
const isTesting = ref<boolean>(false)
const testResult = ref<{ success: boolean; message: string } | null>(null)
const showAnkiImport = ref<boolean>(false)

const saveApiKey = async (): Promise<void> => {
  if (!apiKey.value) return
  isSaving.value = true
  await new Promise((resolve) => setTimeout(resolve, 400))
  localStorage.setItem('openai_api_key', apiKey.value)
  isSaving.value = false
}

const clearApiKey = (): void => {
  apiKey.value = ''
  localStorage.removeItem('openai_api_key')
}

const testApiKey = async (): Promise<void> => {
  if (!apiKey.value) return
  isTesting.value = true
  testResult.value = null
  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      headers: { Authorization: `Bearer ${apiKey.value}` }
    })
    testResult.value = response.ok
      ? { success: true, message: 'API key is valid!' }
      : { success: false, message: 'Invalid API key' }
  } catch (error: unknown) {
    testResult.value = { success: false, message: 'Connection failed' }
  } finally {
    isTesting.value = false
  }
}

const handleClearAnki = (): void => {
  if (confirm('Clear all imported Anki data?')) clearAnkiData()
}

onMounted(() => {
  const saved = localStorage.getItem('openai_api_key')
  apiKey.value = saved ?? ''
  loadFromStorage()
})

watch(apiKey, () => {
  testResult.value = null
})
</script>