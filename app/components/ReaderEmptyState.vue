<template>
  <div class="h-full flex items-center justify-center">
    <div class="text-center px-4">
      <IconBookOpen class="w-20 h-20 mx-auto mb-6 opacity-20" />
      <p class="text-base-content/50 text-lg mb-8">Generate Japanese text to start reading</p>
      
      <button 
        @click="$emit('generate')" 
        class="btn btn-primary gap-2"
        :class="{ 'loading': isGenerating }"
        :disabled="isGenerating"
      >
        <IconSparkles v-if="!isGenerating" class="w-5 h-5" />
        {{ isGenerating ? 'Generating...' : 'Generate Text' }}
      </button>
    </div>
  </div>
</template>

<script setup>
import IconBookOpen from '~icons/lucide/book-open'
import IconSparkles from '~icons/lucide/sparkles'

defineProps({
  isGenerating: {
    type: Boolean,
    required: true
  }
})

defineEmits(['generate'])
</script>