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
  </div>
</template>

<script setup>
import IconBook from '~icons/lucide/book-open'

defineProps({
  activeTab: {
    type: String,
    required: true
  }
})

defineEmits(['update:activeTab'])
</script>