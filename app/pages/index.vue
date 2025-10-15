<template>
  <div class="min-h-screen bg-base-200">
    <!-- Header Navigation -->
    <header class="bg-base-100 border-b border-base-300 sticky top-0 z-50 shadow-sm">
      <div class="w-full">
        <div class="flex items-center justify-between">
          <TabNavigation
            :active-tab="activeTab"
            @update:activeTab="navigateToTab"
          />
          <ThemeSwitcher :current-theme="currentTheme" @update:theme="setTheme" />
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="w-full h-[calc(100vh-65px)] overflow-hidden">
      <ReaderPage v-if="activeTab === 'reader'" />
    </main>
  </div>
</template>

<script setup>
import TabNavigation from '~/components/TabNavigation.vue'
import ThemeSwitcher from '~/components/ThemeSwitcher.vue'
import ReaderPage from '~/components/ReaderPage.vue'

const currentTheme = ref('forest')
const activeTab = ref('reader')

/**
 * Apply saved or selected theme
 */
const setTheme = (theme) => {
  currentTheme.value = theme
  if (process.client) {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }
}

/**
 * Navigate between routes based on selected tab
 */
const navigateToTab = async (tab) => {
  activeTab.value = tab
  if (tab === 'settings') {
    navigateTo('/settings')
  } else if (tab === 'stats') {
    navigateTo('/stats')
  } else {
    navigateTo('/')
  }
}

/**
 * Load theme preference and set default tab
 */
onMounted(() => {
  const savedTheme = localStorage.getItem('theme') || 'forest'
  currentTheme.value = savedTheme
  document.documentElement.setAttribute('data-theme', savedTheme)

  // Determine active tab from route
  const route = useRoute()
  if (route.path.includes('/settings')) activeTab.value = 'settings'
  else if (route.path.includes('/stats')) activeTab.value = 'stats'
  else activeTab.value = 'reader'
})
</script>