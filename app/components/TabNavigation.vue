<template>
  <div class="flex">
    <button 
      class="px-6 py-4 font-medium text-sm transition-all border-b-2 hover:bg-base-200"
      :class="activeTab === 'reader' ? 'border-primary text-primary bg-base-200' : 'border-transparent text-base-content/70'"
      @click="$emit('update:activeTab', 'reader')"
    >
      <div class="flex items-center gap-2">
        <IconBook class="w-5 h-5" />
        <span class="hidden sm:inline">Reader</span>
      </div>
    </button>

    <button 
      class="px-6 py-4 font-medium text-sm transition-all border-b-2 hover:bg-base-200"
      :class="activeTab === 'settings' ? 'border-primary text-primary bg-base-200' : 'border-transparent text-base-content/70'"
      @click="$emit('update:activeTab', 'settings')"
    >
      <div class="flex items-center gap-2">
        <IconSettings class="w-5 h-5" />
        <span class="hidden sm:inline">Settings</span>
      </div>
    </button>

    <button 
      class="px-6 py-4 font-medium text-sm transition-all border-b-2 hover:bg-base-200"
      :class="activeTab === 'stats' ? 'border-primary text-primary bg-base-200' : 'border-transparent text-base-content/70'"
      @click="$emit('update:activeTab', 'stats')"
    >
      <div class="flex items-center gap-2">
        <IconBarChart class="w-5 h-5" />
        <span class="hidden sm:inline">Stats</span>
      </div>
    </button>
  </div>
</template>

<script setup>
import IconBook from '~icons/lucide/book-open'
import IconSettings from '~icons/lucide/settings'
import IconBarChart from '~icons/lucide/bar-chart-3'

defineProps({
  activeTab: {
    type: String,
    required: true
  }
})

defineEmits(['update:activeTab'])
</script>