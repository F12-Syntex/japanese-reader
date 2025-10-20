<template>
  <div class="min-h-screen bg-base-200 flex flex-col items-center py-10">
    <div class="w-full max-w-4xl space-y-8">

      <div class="hero bg-base-100 shadow-xl rounded-box">
        <div class="hero-content flex-col text-center">
          <h1 class="text-4xl font-bold text-primary">Settings</h1>
          <p class="text-base-content/70">Configure your Japanese reader experience</p>
        </div>
      </div>

      <div class="hidden md:flex flex-col gap-8">
        <div class="card bg-base-100 shadow-lg border border-base-300">
          <div class="card-body gap-5">
            <div class="collapse collapse-plus border border-base-300">
              <input type="checkbox" v-model="showApiKeyInput" />
              <div class="collapse-title flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <div class="avatar placeholder">
                    <div class="bg-primary text-primary-content w-8 rounded-full">
                      <IconKey class="w-4 h-4" />
                    </div>
                  </div>
                  <div>
                    <h2 class="font-semibold">OpenAI API Key</h2>
                    <p class="text-sm text-base-content/60">Manage your API authentication</p>
                  </div>
                </div>
                <a href="https://platform.openai.com/api-keys" target="_blank" class="btn btn-sm btn-ghost">
                  <IconExternalLink class="w-4 h-4" /> Get Key
                </a>
              </div>
              <div class="collapse-content space-y-4">
                <label class="input input-bordered flex items-center gap-2">
                  <input v-model="apiKey" :type="showKey ? 'text' : 'password'" class="grow font-mono text-sm" placeholder="sk-proj-..." />
                  <button @click="showKey = !showKey" class="btn btn-ghost btn-xs btn-square">
                    <IconEye v-if="!showKey" class="w-4 h-4" />
                    <IconEyeOff v-else class="w-4 h-4" />
                  </button>
                  <button v-if="apiKey" @click="clearApiKey" class="btn btn-ghost btn-xs btn-square">
                    <IconX class="w-4 h-4" />
                  </button>
                </label>

                <div class="join w-full">
                  <button @click="saveApiKey" class="join-item btn btn-primary w-1/2" :disabled="!apiKey || isSaving">
                    <IconSave class="w-4 h-4" /> Save
                  </button>
                  <button @click="testApiKey" class="join-item btn btn-outline w-1/2" :disabled="!apiKey || isTesting">
                    <IconZap class="w-4 h-4" /> Test
                  </button>
                </div>

                <div v-if="testResult" class="alert" :class="testResult.success ? 'alert-success' : 'alert-error'">
                  <IconCheck v-if="testResult.success" class="w-4 h-4" />
                  <IconAlertCircle v-else class="w-4 h-4" />
                  <span class="text-sm">{{ testResult.message }}</span>
                </div>

                <div class="flex items-center gap-2 text-xs text-base-content/60">
                  <IconShield class="w-3 h-3" />
                  <span>Stored locally in your browser only</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="card bg-base-100 shadow-lg border border-base-300">
          <div class="card-body flex flex-col md:flex-row items-center justify-between gap-4">
            <div class="flex items-center gap-3 flex-1 min-w-0">
              <div class="avatar placeholder">
                <div class="bg-secondary text-secondary-content w-8 rounded-full">
                  <IconDatabase class="w-4 h-4" />
                </div>
              </div>
              <div class="min-w-0">
                <h3 class="font-semibold">Anki Integration</h3>
                <p class="text-sm text-base-content/60 truncate">
                  <span v-if="knownWords.size > 0">{{ knownWords.size.toLocaleString() }} words loaded</span>
                  <span v-else>Import your Anki deck data</span>
                </p>
              </div>
            </div>
            <div class="join">
              <button @click="openAnkiImport" class="join-item btn btn-primary btn-sm">
                <IconUpload class="w-4 h-4" /> Import
              </button>
              <button v-if="knownWords.size > 0" @click="openAnkiVisualizer" class="join-item btn btn-ghost btn-sm">
                <IconEye class="w-4 h-4" /> View
              </button>
              <button v-if="knownWords.size > 0" @click="handleClearAnki" class="join-item btn btn-error btn-sm">
                <IconTrash class="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="md:hidden flex flex-col gap-4">
        <div class="card bg-base-100 shadow-md">
          <div class="card-body">
            <button @click="showApiKeyInput = !showApiKeyInput" class="btn btn-outline w-full">
              <IconKey class="w-4 h-4" /> Manage API Key
            </button>
            <button @click="openAnkiImport" class="btn btn-primary w-full">
              <IconUpload class="w-4 h-4" /> Import Anki
            </button>
            <button v-if="knownWords.size > 0" @click="openAnkiVisualizer" class="btn btn-ghost w-full">
              <IconEye class="w-4 h-4" /> View Words
            </button>
            <button v-if="knownWords.size > 0" @click="handleClearAnki" class="btn btn-error w-full">
              <IconTrash class="w-4 h-4" /> Clear Data
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
import { ref, onMounted, watch } from 'vue'
import { useAnki } from '~/composables/useAnki'

definePageMeta({ layout: 'default' })

const { knownWords, clearAnkiData, loadFromStorage } = useAnki()
const apiKey = ref<string>('')
const showKey = ref(false)
const isSaving = ref(false)
const isTesting = ref(false)
const testResult = ref<{ success: boolean; message: string } | null>(null)
const showAnkiImport = ref(false)
const showAnkiVisualizer = ref(false)
const showApiKeyInput = ref(false)

const saveApiKey = async () => {
  if (!apiKey.value) return
  isSaving.value = true
  await new Promise((r) => setTimeout(r, 400))
  if (import.meta.client) localStorage.setItem('openai_api_key', apiKey.value)
  isSaving.value = false
}

const clearApiKey = () => {
  apiKey.value = ''
  if (import.meta.client) localStorage.removeItem('openai_api_key')
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

const handleClearAnki = () => {
  if (confirm('Clear all imported Anki data?')) clearAnkiData()
}

const openAnkiImport = () => {
  showAnkiVisualizer.value = false
  showAnkiImport.value = true
}

const openAnkiVisualizer = () => {
  showAnkiImport.value = false
  showAnkiVisualizer.value = true
}

onMounted(() => {
  const savedKey = localStorage.getItem('openai_api_key')
  apiKey.value = savedKey ?? ''
  showApiKeyInput.value = !apiKey.value
  loadFromStorage()
})

watch(apiKey, () => (testResult.value = null))
</script>