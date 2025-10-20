<template>
  <div>
    <div class="hidden md:flex tabs tabs-boxed bg-base-200">
      <button 
        class="tab flex items-center gap-2" 
        :class="{ 'tab-active text-primary': activeTab === 'reader' }"
        @click="$emit('update:activeTab', 'reader')"
      >
        <IconBook class="w-5 h-5" />
        <span>Reader</span>
      </button>

      <button 
        class="tab flex items-center gap-2" 
        :class="{ 'tab-active text-primary': activeTab === 'grammar' }"
        @click="$emit('update:activeTab', 'grammar')"
      >
        <IconBookOpen class="w-5 h-5" />
        <span>Grammar</span>
      </button>

      <button 
        class="tab flex items-center gap-2" 
        :class="{ 'tab-active text-primary': activeTab === 'settings' }"
        @click="$emit('update:activeTab', 'settings')"
      >
        <IconSettings class="w-5 h-5" />
        <span>Settings</span>
      </button>

      <button 
        class="tab flex items-center gap-2" 
        :class="{ 'tab-active text-primary': activeTab === 'stats' }"
        @click="$emit('update:activeTab', 'stats')"
      >
        <IconBarChart class="w-5 h-5" />
        <span>Stats</span>
      </button>
    </div>

    <div class="md:hidden fixed bottom-0 w-full bg-base-200">
      <div class="btm-nav">
        <button :class="{ active: activeTab === 'reader' }" @click="$emit('update:activeTab', 'reader')">
          <IconBook class="w-5 h-5" />
        </button>
        <button :class="{ active: activeTab === 'grammar' }" @click="$emit('update:activeTab', 'grammar')">
          <IconBookOpen class="w-5 h-5" />
        </button>
        <button :class="{ active: activeTab === 'settings' }" @click="$emit('update:activeTab', 'settings')">
          <IconSettings class="w-5 h-5" />
        </button>
        <button :class="{ active: activeTab === 'stats' }" @click="$emit('update:activeTab', 'stats')">
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

defineProps<{
  activeTab: string
}>()

defineEmits<{
  (e: 'update:activeTab', tab: string): void
}>()
</script>