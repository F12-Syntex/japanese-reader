<template>
  <div class="flex items-center justify-center h-screen w-full p-4">
    <div class="w-full max-w-md">
      <div class="space-y-8">
        <div class="text-center space-y-4">
          <div class="flex justify-center">
            <div class="text-7xl">📚</div>
          </div>
          
          <div class="space-y-2">
            <h1 class="text-4xl font-bold">Ready to read?</h1>
            <p class="text-lg text-base-content/70">Generate Japanese text to start your reading practice</p>
          </div>
        </div>

        <div class="flex flex-col gap-3">
          <button 
            @click="$emit('generate')"
            class="btn btn-lg btn-primary gap-2 w-full"
            :disabled="isGenerating"
          >
            <svg v-if="!isGenerating" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span v-else class="loading loading-spinner loading-md"></span>
            {{ isGenerating ? 'Generating...' : 'Generate Text' }}
          </button>

          <button 
            @click="$emit('import-url')"
            class="btn btn-lg btn-outline gap-2 w-full"
            :disabled="isGenerating"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
            </svg>
            Import from URL
          </button>
        </div>
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

defineEmits<{
  generate: []
  'import-url': []
}>()
</script>