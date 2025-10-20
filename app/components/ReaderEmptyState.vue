<template>
  <div class="h-full flex items-center justify-center">
    <div class="card bg-base-100 shadow-md border border-base-300 px-6 sm:px-8 py-8 sm:py-12 max-w-sm">
      <div class="card-body items-center text-center">
        <div class="text-5xl mb-6 opacity-20">📖</div>
        <h2 class="card-title text-lg sm:text-2xl mb-2">Ready to read?</h2>
        <p class="text-base-content/70 text-sm sm:text-base mb-6">Generate Japanese text to start your reading practice</p>
        
        <button 
          @click="$emit('generate')" 
          class="btn btn-primary gap-2 w-full sm:w-auto"
          :disabled="isGenerating"
        >
          <svg v-if="!isGenerating" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <span class="loading loading-spinner loading-sm" v-if="isGenerating"></span>
          {{ isGenerating ? 'Generating...' : 'Generate Text' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  isGenerating: boolean
}

withDefaults(defineProps<Props>(), {
  isGenerating: false
})

defineEmits<{
  generate: []
}>()
</script>