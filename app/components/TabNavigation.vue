<template>
  <div>
    <div class="hidden md:flex tabs tabs-boxed bg-base-200">
      <button 
        class="tab flex items-center gap-2" 
        :class="{ 'tab-active text-primary': activeTab === 'reader' }"
        @click="updateTab('reader')"
      >
        <IconBook class="w-5 h-5" />
        <span>Reader</span>
      </button>

      <button 
        class="tab flex items-center gap-2" 
        :class="{ 'tab-active text-primary': activeTab === 'books' }"
        @click="updateTab('books')"
      >
        <IconBookText class="w-5 h-5" />
        <span>Books</span>
      </button>

      <button 
        class="tab flex items-center gap-2" 
        :class="{ 'tab-active text-primary': activeTab === 'grammar' }"
        @click="updateTab('grammar')"
      >
        <IconBookOpen class="w-5 h-5" />
        <span>Grammar</span>
      </button>

      <button 
        class="tab flex items-center gap-2" 
        :class="{ 'tab-active text-primary': activeTab === 'stats' }"
        @click="updateTab('stats')"
      >
        <IconBarChart class="w-5 h-5" />
        <span>Stats</span>
      </button>
    </div>

    <div class="md:hidden fixed bottom-0 left-0 right-0 bg-base-200 dark:bg-base-800 border-t border-base-300 dark:border-base-700 z-40">
      <div class="btm-nav bg-base-200 dark:bg-base-800">
        <button :class="{ active: activeTab === 'reader' }" @click="updateTab('reader')">
          <IconBook class="w-5 h-5" />
        </button>
        <button :class="{ active: activeTab === 'books' }" @click="updateTab('books')">
          <IconBookText class="w-5 h-5" />
        </button>
        <button :class="{ active: activeTab === 'grammar' }" @click="updateTab('grammar')">
          <IconBookOpen class="w-5 h-5" />
        </button>
        <button :class="{ active: activeTab === 'stats' }" @click="updateTab('stats')">
          <IconBarChart class="w-5 h-5" />
        </button>
        <button @click="openSettings">
          <IconSettings class="w-5 h-5" />
        </button>
        <ThemeSwitcher :current-theme="currentTheme" @update:theme="handleThemeUpdate" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import IconBook from '~icons/lucide/book-open'
import IconBookOpen from '~icons/lucide/book'
import IconBookText from '~icons/lucide/book-text'
import IconSettings from '~icons/lucide/settings'
import IconBarChart from '~icons/lucide/bar-chart-3'
import ThemeSwitcher from '~/components/ThemeSwitcher.vue'

interface Props {
  activeTab: string
  currentTheme: string
}

defineProps<Props>()

const emit = defineEmits<{
  'update:activeTab': [tab: string]
  'open-settings': []
  'update:theme': [theme: string]
}>()

const updateTab = (tab: string): void => {
  emit('update:activeTab', tab)
}

const openSettings = (): void => {
  emit('open-settings')
}

const handleThemeUpdate = (theme: string): void => {
  emit('update:theme', theme)
}
</script>