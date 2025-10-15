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
      <div class="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
        <div class="bg-base-100 rounded-lg shadow-sm border border-base-300 overflow-hidden">
          <div class="bg-gradient-to-r from-primary/10 to-secondary/10 px-4 sm:px-6 py-6 sm:py-8 border-b border-base-300">
            <div class="flex items-center gap-3 sm:gap-4">
              <div class="p-2 sm:p-3 bg-primary/20 rounded-lg sm:rounded-xl flex-shrink-0">
                <IconKey class="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
              </div>
              <div class="min-w-0">
                <h2 class="text-xl sm:text-2xl lg:text-3xl font-bold truncate">API Configuration</h2>
                <p class="text-sm sm:text-base text-base-content/60 mt-1 hidden sm:block">Configure your OpenAI API credentials</p>
              </div>
            </div>
          </div>

          <div class="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
            <div class="form-control w-full">
              <label class="label">
                <span class="label-text font-semibold text-sm sm:text-base flex items-center gap-2">
                  <IconKey class="w-4 h-4 flex-shrink-0" />
                  OpenAI API Key
                </span>
                <a 
                  href="https://platform.openai.com/api-keys" 
                  target="_blank"
                  class="label-text-alt link link-primary flex items-center gap-1 text-xs sm:text-sm"
                >
                  <span class="hidden sm:inline">Get API Key</span>
                  <span class="sm:hidden">Get Key</span>
                  <IconExternalLink class="w-3 h-3 flex-shrink-0" />
                </a>
              </label>
              <div class="relative">
                <input 
                  v-model="apiKey"
                  :type="showKey ? 'text' : 'password'"
                  placeholder="sk-proj-..."
                  class="input input-bordered w-full pr-20 sm:pr-24 font-mono text-xs sm:text-sm"
                  :class="{ 'input-success': keySaved }"
                />
                <div class="absolute right-1.5 sm:right-2 top-1/2 -translate-y-1/2 flex gap-1">
                  <button 
                    @click="showKey = !showKey"
                    class="btn btn-ghost btn-xs sm:btn-sm btn-square"
                    type="button"
                  >
                    <IconEye v-if="!showKey" class="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <IconEyeOff v-else class="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </button>
                  <button 
                    v-if="apiKey"
                    @click="clearApiKey"
                    class="btn btn-ghost btn-xs sm:btn-sm btn-square"
                    type="button"
                  >
                    <IconX class="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </button>
                </div>
              </div>
              <label class="label">
                <span class="label-text-alt text-xs flex items-center gap-1.5">
                  <IconShield class="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" />
                  <span class="hidden sm:inline">Stored locally in your browser only</span>
                  <span class="sm:hidden">Stored locally only</span>
                </span>
                <span v-if="lastSaved" class="label-text-alt text-xs text-success flex items-center gap-1">
                  <IconCheck class="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" />
                  <span class="hidden sm:inline">Saved {{ lastSaved }}</span>
                  <span class="sm:hidden">Saved</span>
                </span>
              </label>
            </div>

            <div class="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <button 
                @click="saveApiKey"
                class="btn btn-primary flex-1 gap-2 btn-sm sm:btn-md"
                :disabled="!apiKey || isSaving"
                :class="{ 'loading': isSaving }"
              >
                <IconSave v-if="!isSaving" class="w-4 h-4 sm:w-5 sm:h-5" />
                {{ isSaving ? 'Saving...' : keySaved ? 'Update API Key' : 'Save API Key' }}
              </button>
              <button 
                @click="testApiKey"
                class="btn btn-outline flex-1 gap-2 btn-sm sm:btn-md"
                :disabled="!apiKey || isTesting"
                :class="{ 'loading': isTesting }"
              >
                <IconZap v-if="!isTesting" class="w-4 h-4 sm:w-5 sm:h-5" />
                {{ isTesting ? 'Testing...' : 'Test Connection' }}
              </button>
            </div>

            <div v-if="testResult" class="alert alert-sm sm:alert-md" :class="testResult.success ? 'alert-success' : 'alert-error'">
              <IconCheck v-if="testResult.success" class="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
              <IconAlertCircle v-else class="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
              <span class="text-xs sm:text-sm">{{ testResult.message }}</span>
            </div>
          </div>
        </div>

        <div class="bg-base-100 rounded-lg shadow-sm border border-base-300 overflow-hidden">
          <div class="px-4 sm:px-6 py-4 sm:py-5 border-b border-base-300">
            <div class="flex items-center gap-2 sm:gap-3">
              <IconBookOpen class="w-5 h-5 sm:w-6 sm:h-6 text-primary flex-shrink-0" />
              <h3 class="text-lg sm:text-xl font-bold">How to Get Your API Key</h3>
            </div>
          </div>
          
          <div class="p-4 sm:p-6 space-y-3 sm:space-y-4">
            <ol class="space-y-3 sm:space-y-4 list-none">
              <li class="flex gap-3 sm:gap-4">
                <div class="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary text-sm sm:text-base">1</div>
                <div class="flex-1 min-w-0">
                  <p class="font-medium text-sm sm:text-base">Visit OpenAI Platform</p>
                  <p class="text-xs sm:text-sm text-base-content/70 mt-1 break-words">Go to <a href="https://platform.openai.com/api-keys" target="_blank" class="link link-primary">platform.openai.com/api-keys</a></p>
                </div>
              </li>
              <li class="flex gap-3 sm:gap-4">
                <div class="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary text-sm sm:text-base">2</div>
                <div class="flex-1 min-w-0">
                  <p class="font-medium text-sm sm:text-base">Create New Secret Key</p>
                  <p class="text-xs sm:text-sm text-base-content/70 mt-1">Click "Create new secret key" and give it a name</p>
                </div>
              </li>
              <li class="flex gap-3 sm:gap-4">
                <div class="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary text-sm sm:text-base">3</div>
                <div class="flex-1 min-w-0">
                  <p class="font-medium text-sm sm:text-base">Copy and Save</p>
                  <p class="text-xs sm:text-sm text-base-content/70 mt-1">Copy your API key and paste it above (you won't be able to see it again)</p>
                </div>
              </li>
            </ol>

            <div class="alert alert-warning alert-sm sm:alert-md mt-4 sm:mt-6">
              <IconAlertTriangle class="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
              <div class="text-xs sm:text-sm min-w-0">
                <p class="font-medium">API Key Security</p>
                <p class="opacity-80 mt-1">Never share your API key publicly. It provides access to your OpenAI account.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
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
import IconBookOpen from '~icons/lucide/book-open'
import IconAlertTriangle from '~icons/lucide/alert-triangle'

const apiKey = ref('')
const currentTheme = ref('forest')
const activeTab = ref('settings')
const showKey = ref(false)
const keySaved = ref(false)
const isSaving = ref(false)
const isTesting = ref(false)
const lastSaved = ref('')
const testResult = ref(null)

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
      localStorage.setItem('api_key_saved_time', new Date().toISOString())
      keySaved.value = true
      updateLastSaved()
      isSaving.value = false
      
      setTimeout(() => {
        keySaved.value = false
      }, 3000)
    }
  }, 500)
}

const clearApiKey = () => {
  apiKey.value = ''
  keySaved.value = false
  lastSaved.value = ''
  if (process.client) {
    localStorage.removeItem('openai_api_key')
    localStorage.removeItem('api_key_saved_time')
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
        message: 'API key is valid and working!'
      }
    } else {
      testResult.value = {
        success: false,
        message: 'Invalid API key. Please check and try again.'
      }
    }
  } catch (error) {
    testResult.value = {
      success: false,
      message: 'Connection failed. Please check your internet connection.'
    }
  } finally {
    isTesting.value = false
  }
}

const updateLastSaved = () => {
  const now = new Date()
  const timeStr = now.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  })
  lastSaved.value = timeStr
}

onMounted(() => {
  const savedTheme = localStorage.getItem('theme') || 'forest'
  currentTheme.value = savedTheme
  document.documentElement.setAttribute('data-theme', savedTheme)
  
  const savedApiKey = localStorage.getItem('openai_api_key') || ''
  apiKey.value = savedApiKey
  
  if (savedApiKey) {
    const savedTime = localStorage.getItem('api_key_saved_time')
    if (savedTime) {
      const date = new Date(savedTime)
      const now = new Date()
      
      if (date.toDateString() === now.toDateString()) {
        updateLastSaved()
      } else {
        lastSaved.value = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      }
    }
  }
})

watch(apiKey, () => {
  testResult.value = null
})
</script>