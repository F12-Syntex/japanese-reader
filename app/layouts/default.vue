<template>
  <div class="min-h-screen bg-base-200">
    <header class="bg-base-100 border-b border-base-300 sticky top-0 z-50 shadow-sm">
      <div class="w-full">
        <div class="flex items-center justify-between px-4">
          <div class="flex items-center gap-2">
            <IconBookOpen class="w-6 h-6 text-primary" />
            <h1 class="text-xl font-bold hidden sm:block">Japanese Reader</h1>
          </div>
          
          <TabNavigation :active-tab="activeTab" @update:activeTab="navigateToTab" />
          
          <ThemeSwitcher :current-theme="currentTheme" @update:theme="setTheme" />
        </div>
      </div>
    </header>

    <main class="w-full h-[calc(100vh-65px)] overflow-hidden">
      <slot />
    </main>
  </div>
</template>

<script setup>
import IconBookOpen from '~icons/lucide/book-open'
import { useTheme } from '~/composables/useTheme'
import { useOpenAI } from '~/composables/useOpenAI'

const route = useRoute()
const { currentTheme, loadTheme, setTheme } = useTheme()
const { loadApiKey } = useOpenAI()

const activeTab = computed(() => {
  const path = route.path
  if (path === '/config') return 'config'
  if (path === '/stats') return 'stats'
  if (path === '/grammar-catalog') return 'grammar'
  return 'reader'
})

const navigateToTab = (tab) => {
  if (tab === 'config') navigateTo('/config')
  else if (tab === 'stats') navigateTo('/stats')
  else if (tab === 'grammar') navigateTo('/grammar-catalog')
  else navigateTo('/')
}

onMounted(() => {
  loadTheme()
  loadApiKey()
})
</script>