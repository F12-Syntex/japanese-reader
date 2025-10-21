<template>
  <div class="min-h-screen bg-base-200">
    <header class="bg-base-100 border-b border-base-300 sticky top-0 z-50 shadow-sm">
      <div class="w-full px-2 sm:px-4 py-2 sm:py-3">
        <div class="flex items-center justify-between gap-2">
          <div class="flex items-center gap-2 min-w-0">
            <IconBookOpen class="w-5 h-5 sm:w-6 sm:h-6 text-primary flex-shrink-0 hidden sm:block" />
            <h1 class="text-lg sm:text-xl font-bold hidden sm:block truncate">Japanese Reader</h1>
          </div>
          
          <TabNavigation :active-tab="activeTab" :current-theme="currentTheme" @update:activeTab="navigateToTab" @open-settings="showSettings = true" />
          
          <div class="hidden md:flex items-center gap-1">
            <ThemeSwitcher :current-theme="currentTheme" @update:theme="setTheme" />
            <button @click="showSettings = true" class="btn btn-ghost btn-sm gap-2">
              <IconSettings class="w-5 h-5" />
              <span class="hidden lg:inline">Settings</span>
            </button>
          </div>
        </div>
      </div>
    </header>

    <main class="w-full h-[calc(100vh-65px)] overflow-hidden">
      <slot />
    </main>

    <ReaderSettingsModal v-model="showSettings" />
  </div>
</template>

<script setup lang="ts">
import IconBookOpen from '~icons/lucide/book-open'
import IconSettings from '~icons/lucide/settings'
import { useTheme } from '~/composables/useTheme'
import { useOpenAI } from '~/composables/useOpenAI'
import ReaderSettingsModal from '~/components/settings/ReaderSettingsModal.vue'

const route = useRoute()
const { currentTheme, loadTheme, setTheme } = useTheme()
const { loadApiKey } = useOpenAI()
const showSettings = ref<boolean>(false)

const activeTab = computed((): string => {
  const path = route.path
  if (path === '/config') return 'config'
  if (path === '/stats') return 'stats'
  if (path === '/grammar-catalog') return 'grammar'
  return 'reader'
})

const navigateToTab = (tab: string): void => {
  if (tab === 'config') navigateTo('/config')
  else if (tab === 'stats') navigateTo('/stats')
  else if (tab === 'grammar') navigateTo('/grammar-catalog')
  else navigateTo('/')
}

onMounted((): void => {
  loadTheme()
  loadApiKey()
})
</script>