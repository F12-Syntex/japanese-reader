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

    <div class="md:hidden fixed bottom-0 left-0 right-0 bg-base-200 z-40">
      <div class="btm-nav">
        <button :class="{ active: activeTab === 'reader' }" @click="updateTab('reader')">
          <IconBook class="w-5 h-5" />
        </button>
        <button :class="{ active: activeTab === 'grammar' }" @click="updateTab('grammar')">
          <IconBookOpen class="w-5 h-5" />
        </button>
        <button :class="{ active: activeTab === 'stats' }" @click="updateTab('stats')">
          <IconBarChart class="w-5 h-5" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import IconBook from '~icons/lucide/book-open'
import IconBookOpen from '~icons/lucide/book'
import IconSettings from '~icons/lucide/settings'
import IconBarChart from '~icons/lucide/bar-chart-3'

interface Props {
  activeTab: string
}

defineProps<Props>()

const emit = defineEmits<{
  (e: 'update:activeTab', tab: string): void
}>()

const updateTab = (tab: string): void => {
  emit('update:activeTab', tab)
}
</script>