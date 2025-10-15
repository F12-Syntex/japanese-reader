<template>
  <div class="min-h-screen bg-base-200">
    <header class="bg-base-100 border-b border-base-300 sticky top-0 z-50 shadow-sm">
      <div class="w-full">
        <div class="flex items-center justify-between">
          <TabNavigation :active-tab="activeTab" @update:activeTab="navigateTo($event === 'settings' ? '/settings' : '/')" />
          <ThemeSwitcher :current-theme="currentTheme" @update:theme="setTheme" />
        </div>
      </div>
    </header>

    <main class="w-full h-[calc(100vh-65px)] overflow-hidden">
      <ReaderPage v-if="activeTab === 'reader'" />
    </main>
  </div>
</template>

<script setup>
const currentTheme = ref('forest')
const activeTab = ref('reader')

const setTheme = (theme) => {
  currentTheme.value = theme
  if (process.client) {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }
}

onMounted(() => {
  const savedTheme = localStorage.getItem('theme') || 'forest'
  currentTheme.value = savedTheme
  document.documentElement.setAttribute('data-theme', savedTheme)
})
</script>