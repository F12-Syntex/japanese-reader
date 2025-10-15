// pages/settings.vue
<template>
  <div class="min-h-screen bg-base-200">
    <header class="bg-base-100 border-b border-base-300 sticky top-0 z-50 shadow-sm">
      <div class="w-full">
        <div class="flex items-center justify-between">
          <TabNavigation :active-tab="activeTab" @update:activeTab="navigateTo($event === 'reader' ? '/' : '/settings')" />
          <ThemeSwitcher :current-theme="currentTheme" @update:theme="setTheme" />
        </div>
      </div>
    </header>

    <main class="w-full h-[calc(100vh-65px)] overflow-y-auto custom-scrollbar">
      <div class="max-w-4xl mx-auto py-8 px-4 sm:px-6 space-y-1">
        <div class="mb-8">
          <h1 class="text-3xl font-bold">Settings</h1>
          <p class="text-base-content/60 mt-1">Configure your Japanese reader experience</p>
        </div>

        <div class="bg-base-100 border-b border-base-300 px-6 py-4 hover:bg-base-200 transition-colors">
          <div class="flex items-center justify-between gap-4">
            <div class="flex items-center gap-3 flex-1 min-w-0">
              <IconKey class="w-5 h-5 text-primary flex-shrink-0" />
              <div class="flex-1 min-w-0">
                <h3 class="font-semibold">OpenAI API Key</h3>
                <p class="text-sm text-base-content/60">Required for text generation</p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <a 
                href="https://platform.openai.com/api-keys" 
                target="_blank"
                class="btn btn-ghost btn-sm gap-1"
              >
                <IconExternalLink class="w-4 h-4" />
                <span class="hidden sm:inline">Get Key</span>
              </a>
              <button 
                @click="showApiKeyInput = !showApiKeyInput"
                class="btn btn-ghost btn-sm"
              >
                <IconChevronDown class="w-4 h-4 transition-transform" :class="{ 'rotate-180': showApiKeyInput }" />
              </button>
            </div>
          </div>
        </div>

        <div v-if="showApiKeyInput" class="bg-base-100 border-b border-base-300 px-6 py-4">
          <div class="space-y-3">
            <div class="relative">
              <input 
                v-model="apiKey"
                :type="showKey ? 'text' : 'password'"
                placeholder="sk-proj-..."
                class="input input-bordered w-full pr-20 font-mono text-sm"
              />
              <div class="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                <button 
                  @click="showKey = !showKey"
                  class="btn btn-ghost btn-sm btn-square"
                >
                  <IconEye v-if="!showKey" class="w-4 h-4" />
                  <IconEyeOff v-else class="w-4 h-4" />
                </button>
                <button 
                  v-if="apiKey"
                  @click="clearApiKey"
                  class="btn btn-ghost btn-sm btn-square"
                >
                  <IconX class="w-4 h-4" />
                </button>
              </div>
            </div>

            <div class="flex gap-2">
              <button 
                @click="saveApiKey"
                class="btn btn-primary btn-sm flex-1"
                :disabled="!apiKey || isSaving"
              >
                <IconSave class="w-4 h-4" />
                Save
              </button>
              <button 
                @click="testApiKey"
                class="btn btn-outline btn-sm flex-1"
                :disabled="!apiKey || isTesting"
              >
                <IconZap class="w-4 h-4" />
                Test
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

        <div class="bg-base-100 px-6 py-4 hover:bg-base-200 transition-colors rounded-b-lg">
          <div class="flex items-center justify-between gap-4">
            <div class="flex items-center gap-3 flex-1 min-w-0">
              <IconDatabase class="w-5 h-5 text-secondary flex-shrink-0" />
              <div class="flex-1 min-w-0">
                <h3 class="font-semibold">Anki Integration</h3>
                <p class="text-sm text-base-content/60">
                  <span v-if="knownWords.size > 0">{{ knownWords.size.toLocaleString() }} words loaded</span>
                  <span v-else>Import your Anki deck data</span>
                </p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <button 
                @click="showAnkiImport = true"
                class="btn btn-primary btn-sm gap-2"
              >
                <IconUpload class="w-4 h-4" />
                <span class="hidden sm:inline">Import</span>
              </button>
              <button 
                v-if="knownWords.size > 0"
                @click="showAnkiVisualizer = true"
                class="btn btn-ghost btn-sm gap-2"
              >
                <IconEye class="w-4 h-4" />
                <span class="hidden sm:inline">View</span>
              </button>
              <button 
                v-if="knownWords.size > 0"
                @click="handleClearAnki"
                class="btn btn-ghost btn-error btn-sm btn-square"
              >
                <IconTrash class="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>

    <AnkiImportModal v-model="showAnkiImport" />
    <AnkiVisualizer v-model="showAnkiVisualizer" />
  </div>
</template>

<script setup>
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
import IconChevronDown from '~icons/lucide/chevron-down'

const { knownWords, clearAnkiData, loadFromStorage } = useAnki()

const apiKey = ref('')
const currentTheme = ref('forest')
const activeTab = ref('settings')
const showKey = ref(false)
const isSaving = ref(false)
const isTesting = ref(false)
const testResult = ref(null)
const showAnkiVisualizer = ref(false)
const showAnkiImport = ref(false)
const showApiKeyInput = ref(false)

const setTheme = (theme) => {
  currentTheme.value = theme
  if (process.client) {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }
}

const saveApiKey = async () => {
  if (!apiKey.value) return
  
  isSaving.value = true
  
  setTimeout(() => {
    if (process.client) {
      localStorage.setItem('openai_api_key', apiKey.value)
      isSaving.value = false
    }
  }, 300)
}

const clearApiKey = () => {
  apiKey.value = ''
  if (process.client) {
    localStorage.removeItem('openai_api_key')
  }
}

const handleClearAnki = () => {
  if (confirm('Clear all imported Anki data?')) {
    clearAnkiData()
  }
}

const testApiKey = async () => {
  if (!apiKey.value) return
  
  isTesting.value = true
  testResult.value = null
  
  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${apiKey.value}`
      }
    })
    
    if (response.ok) {
      testResult.value = {
        success: true,
        message: 'API key is valid!'
      }
    } else {
      testResult.value = {
        success: false,
        message: 'Invalid API key'
      }
    }
  } catch (error) {
    testResult.value = {
      success: false,
      message: 'Connection failed'
    }
  } finally {
    isTesting.value = false
  }
}

onMounted(() => {
  const savedTheme = localStorage.getItem('theme') || 'forest'
  currentTheme.value = savedTheme
  document.documentElement.setAttribute('data-theme', savedTheme)
  
  const savedApiKey = localStorage.getItem('openai_api_key') || ''
  apiKey.value = savedApiKey
  showApiKeyInput.value = !savedApiKey

  loadFromStorage()
})

watch(apiKey, () => {
  testResult.value = null
})
</script>