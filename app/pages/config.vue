<template>
  <div class="min-h-screen bg-gradient-to-br from-base-100 to-base-200 py-12 px-4">
    <div class="max-w-2xl mx-auto space-y-6">
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold">Account</h1>
        <p class="text-base-content/60 mt-2">API Keys & Learning Data</p>
      </div>

      <div class="card bg-base-100 shadow-lg">
        <div class="card-body">
          <h2 class="card-title text-lg flex items-center gap-2">
            <IconKey class="w-5 h-5" />
            OpenAI API Key
          </h2>
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

      <div class="card bg-base-100 shadow-lg">
        <div class="card-body">
          <h2 class="card-title text-lg flex items-center gap-2">
            <IconDatabase class="w-5 h-5" />
            Learning Data
          </h2>
          <p class="text-sm text-base-content/60">
            {{ knownWords.size > 0 ? `${knownWords.size.toLocaleString()} words imported` : 'No data imported yet' }}
          </p>
          <div class="card-actions justify-end gap-2 mt-4">
            <button
              @click="openAnkiImport"
              class="btn btn-primary btn-sm"
            >
              <IconUpload class="w-4 h-4" />
              Import
            </button>
            <button
              v-if="knownWords.size > 0"
              @click="openAnkiVisualizer"
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
    </div>

    <ClientOnly>
      <AnkiImportModal v-model="showAnkiImport" />
      <AnkiVisualizer v-model="showAnkiVisualizer" />
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

definePageMeta({ layout: 'default' })

const { knownWords, clearAnkiData, loadFromStorage } = useAnki()

const apiKey = ref<string>('')
const showKey = ref<boolean>(false)
const isSaving = ref<boolean>(false)
const isTesting = ref<boolean>(false)
const testResult = ref<{ success: boolean; message: string } | null>(null)
const showAnkiImport = ref<boolean>(false)
const showAnkiVisualizer = ref<boolean>(false)

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
  } catch {
    testResult.value = { success: false, message: 'Connection failed' }
  } finally {
    isTesting.value = false
  }
}

const handleClearAnki = (): void => {
  if (confirm('Clear all imported Anki data?')) clearAnkiData()
}

const openAnkiImport = (): void => {
  showAnkiVisualizer.value = false
  showAnkiImport.value = true
}

const openAnkiVisualizer = (): void => {
  showAnkiImport.value = false
  showAnkiVisualizer.value = true
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