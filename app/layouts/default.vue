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

const route = useRoute()
const currentTheme = ref('forest')

const activeTab = computed(() => {
  const path = route.path
  if (path === '/settings') return 'settings'
  if (path === '/stats') return 'stats'
  if (path === '/grammar-catalog') return 'grammar'
  return 'reader'
})

const setTheme = (theme) => {
  currentTheme.value = theme
  if (import.meta.client) {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }
}

const navigateToTab = (tab) => {
  if (tab === 'settings') navigateTo('/settings')
  else if (tab === 'stats') navigateTo('/stats')
  else if (tab === 'grammar') navigateTo('/grammar-catalog')
  else navigateTo('/')
}

onMounted(() => {
  const savedTheme = localStorage.getItem('theme') || 'forest'
  currentTheme.value = savedTheme
  document.documentElement.setAttribute('data-theme', savedTheme)
})
</script>