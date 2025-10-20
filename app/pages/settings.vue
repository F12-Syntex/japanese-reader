<template>
  <div class="w-full h-full overflow-y-auto">
    <div class="max-w-4xl mx-auto py-8 px-4 sm:px-6 space-y-4">
      <div class="mb-8">
        <h1 class="text-3xl font-bold">Settings</h1>
        <p class="text-base-content/60 mt-1">Configure your Japanese reader experience</p>
      </div>

      <div class="collapse collapse-arrow bg-base-100 shadow-sm">
        <input type="checkbox" v-model="showApiKeyInput" />
        <div class="collapse-title flex items-center justify-between gap-4">
          <div class="flex items-center gap-3">
            <IconKey class="w-5 h-5 text-primary" />
            <div>
              <h3 class="font-semibold">OpenAI API Key</h3>
              <p class="text-sm text-base-content/60">Required for text generation</p>
            </div>
          </div>
          <a href="https://platform.openai.com/api-keys" target="_blank" class="btn btn-ghost btn-sm flex items-center gap-1">
            <IconExternalLink class="w-4 h-4" />
            Get Key
          </a>
        </div>
        <div class="collapse-content space-y-3">
          <div class="relative">
            <input v-model="apiKey" :type="showKey ? 'text' : 'password'" class="input input-bordered w-full pr-20 font-mono text-sm" placeholder="sk-proj-..." />
            <div class="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
              <button @click="showKey = !showKey" class="btn btn-ghost btn-sm btn-square">
                <IconEye v-if="!showKey" class="w-4 h-4" />
                <IconEyeOff v-else class="w-4 h-4" />
              </button>
              <button v-if="apiKey" @click="clearApiKey" class="btn btn-ghost btn-sm btn-square">
                <IconX class="w-4 h-4" />
              </button>
            </div>
          </div>

          <div class="flex gap-2">
            <button @click="saveApiKey" class="btn btn-primary btn-sm flex-1" :disabled="!apiKey || isSaving">
              <IconSave class="w-4 h-4" /> Save
            </button>
            <button @click="testApiKey" class="btn btn-outline btn-sm flex-1" :disabled="!apiKey || isTesting">
              <IconZap class="w-4 h-4" /> Test
            </button>
          </div>

          <div v-if="testResult" class="alert alert-sm" :class="testResult.success ? 'alert-success' : 'alert-error'">
            <IconCheck v-if="testResult.success" class="w-4 h-4" />
            <IconAlertCircle v-else class="w-4 h-4" />
            <span class="text-xs">{{ testResult.message }}</span>
          </div>

          <div class="flex items-center gap-2 text-xs text-base-content/60">
            <IconShield class="w-3 h-3" />
            <span>Stored locally in your browser only</span>
          </div>
        </div>
      </div>

      <div class="card bg-base-100 shadow-sm p-4 sm:p-6">
        <div class="flex justify-between items-center gap-2">
          <div class="flex items-center gap-3 flex-1 min-w-0">
            <IconDatabase class="w-5 h-5 text-secondary" />
            <div class="flex-1 min-w-0">
              <h3 class="font-semibold">Anki Integration</h3>
              <p class="text-sm text-base-content/60">
                <span v-if="knownWords.size > 0">{{ knownWords.size.toLocaleString() }} words loaded</span>
                <span v-else>Import your Anki deck data</span>
              </p>
            </div>
          </div>
          <div class="join">
            <button @click="openAnkiImport" class="join-item btn btn-primary btn-sm gap-2">
              <IconUpload class="w-4 h-4" /> Import
            </button>
            <button v-if="knownWords.size > 0" @click="openAnkiVisualizer" class="join-item btn btn-ghost btn-sm">
              <IconEye class="w-4 h-4" /> View
            </button>
            <button v-if="knownWords.size > 0" @click="handleClearAnki" class="join-item btn btn-ghost btn-error btn-sm">
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
import IconExternalLink from '~icons/lucide/external-link'
import IconZap from '~icons/lucide/zap'
import IconAlertCircle from '~icons/lucide/alert-circle'
import IconDatabase from '~icons/lucide/database'
import IconTrash from '~icons/lucide/trash-2'
import IconUpload from '~icons/lucide/upload'

definePageMeta({ layout: 'default' })

const { knownWords, clearAnkiData, loadFromStorage } = useAnki()
const apiKey = ref<string>('')
const showKey = ref<boolean>(false)
const isSaving = ref<boolean>(false)
const isTesting = ref<boolean>(false)
const testResult = ref<{ success: boolean; message: string } | null>(null)
const showAnkiVisualizer = ref<boolean>(false)
const showAnkiImport = ref<boolean>(false)
const showApiKeyInput = ref<boolean>(false)

const closeAllModals = () => {
  showAnkiImport.value = false
  showAnkiVisualizer.value = false
}

const openAnkiImport = () => {
  closeAllModals()
  showAnkiImport.value = true
}

const openAnkiVisualizer = () => {
  closeAllModals()
  showAnkiVisualizer.value = true
}

const saveApiKey = async () => {
  if (!apiKey.value) return
  isSaving.value = true
  setTimeout(() => {
    if (import.meta.client) {
      localStorage.setItem('openai_api_key', apiKey.value)
      isSaving.value = false
    }
  }, 400)
}

const clearApiKey = () => {
  apiKey.value = ''
  if (import.meta.client) localStorage.removeItem('openai_api_key')
}

const handleClearAnki = () => {
  if (confirm('Clear all imported Anki data?')) clearAnkiData()
}

const testApiKey = async () => {
  if (!apiKey.value) return
  isTesting.value = true
  testResult.value = null
  try {
    const r = await fetch('https://api.openai.com/v1/models', {
      headers: { Authorization: `Bearer ${apiKey.value}` }
    })
    testResult.value = r.ok
      ? { success: true, message: 'API key is valid!' }
      : { success: false, message: 'Invalid API key' }
  } catch {
    testResult.value = { success: false, message: 'Connection failed' }
  } finally {
    isTesting.value = false
  }
}

onMounted(() => {
  const savedKey = localStorage.getItem('openai_api_key')
  apiKey.value = savedKey ?? ''
  showApiKeyInput.value = !apiKey.value
  loadFromStorage()
})

watch(apiKey, () => (testResult.value = null))
</script>