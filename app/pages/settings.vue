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

    <main class="w-full max-w-4xl mx-auto p-6 space-y-6">
      <div class="bg-base-100 rounded-lg shadow-sm p-6">
        <h2 class="text-2xl font-bold mb-6">API Settings</h2>
        
        <div class="form-control w-full">
          <label class="label">
            <span class="label-text font-medium">OpenAI API Key</span>
          </label>
          <input 
            v-model="apiKey"
            type="password"
            placeholder="sk-..."
            class="input input-bordered w-full"
          />
          <label class="label">
            <span class="label-text-alt">Your API key is stored locally and never sent anywhere except OpenAI</span>
          </label>
        </div>

        <button 
          @click="saveApiKey"
          class="btn btn-primary mt-4"
        >
          Save API Key
        </button>
      </div>
    </main>
  </div>
</template>

<script setup>
const apiKey = ref('')
const currentTheme = ref('forest')
const activeTab = ref('settings')

const setTheme = (theme) => {
  currentTheme.value = theme
  if (process.client) {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }
}

const saveApiKey = () => {
  if (process.client) {
    localStorage.setItem('openai_api_key', apiKey.value)
  }
}

onMounted(() => {
  const savedTheme = localStorage.getItem('theme') || 'forest'
  currentTheme.value = savedTheme
  document.documentElement.setAttribute('data-theme', savedTheme)
  
  const savedApiKey = localStorage.getItem('openai_api_key') || ''
  apiKey.value = savedApiKey
})
</script>