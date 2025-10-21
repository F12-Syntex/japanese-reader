<template>
  <div class="fixed inset-0 flex items-center justify-center p-4 bg-base-200">
    <div class="card w-full max-w-md">
      <div class="card-body gap-6">
        <div class="flex justify-center">
          <div class="text-6xl">📖</div>
        </div>
        
        <div class="text-center space-y-2">
          <h1 class="card-title text-2xl sm:text-3xl justify-center">Ready to read?</h1>
          <p class="text-base-content/60 text-sm sm:text-base">Generate Japanese text to start your reading practice</p>
        </div>

        <div class="divider my-0"></div>

        <button 
        @click="$emit('generate')" 
          class="btn btn-primary btn-block gap-2"
          :disabled="isGenerating"
        >
          <svg v-if="!isGenerating" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <span v-else class="loading loading-spinner loading-sm"></span>
          {{ isGenerating ? 'Generating...' : 'Generate Text' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  isGenerating?: boolean
}

withDefaults(defineProps<Props>(), {
  isGenerating: false
})
</script>