<template>
  <BaseModal 
    :model-value="modelValue" 
    @update:model-value="$emit('update:modelValue', $event)"
    title="Import from URL"
    subtitle="Enter a webpage URL to extract Japanese text"
    size="lg"
  >
    <div class="space-y-4">
      <div class="form-control">
        <label class="label">
          <span class="label-text">URL</span>
        </label>
        <input 
          v-model="url"
          type="url"
          placeholder="https://example.com"
          class="input input-bordered w-full"
          :disabled="isLoading"
          @keydown.enter="handleImport"
        />
      </div>

      <div v-if="error" class="alert alert-error">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>{{ error }}</span>
      </div>

      <div class="flex gap-2 justify-end">
        <button 
          @click="$emit('update:modelValue', false)" 
          class="btn btn-ghost"
          :disabled="isLoading"
        >
          Cancel
        </button>
        <button 
          @click="handleImport"
          class="btn btn-primary gap-2"
          :disabled="isLoading || !url"
        >
          <span v-if="isLoading" class="loading loading-spinner loading-sm"></span>
          {{ isLoading ? 'Importing...' : 'Import' }}
        </button>
      </div>
    </div>
  </BaseModal>
</template>

<script setup lang="ts">
interface Props {
  modelValue: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'import': [text: string]
}>()

const url = ref('')
const isLoading = ref(false)
const error = ref<string | null>(null)

const handleImport = async () => {
  if (!url.value) return

  isLoading.value = true
  error.value = null

  try {
    const response = await $fetch<{ text: string }>('/api/import-url', {
      method: 'POST',
      body: { url: url.value }
    })

    if (!response.text) {
      throw new Error('No text found')
    }

    emit('import', response.text)
    emit('update:modelValue', false)
    url.value = ''
  } catch (e: any) {
    error.value = e.message || 'Failed to import URL'
  } finally {
    isLoading.value = false
  }
}

watch(() => props.modelValue, (val) => {
  if (!val) {
    url.value = ''
    error.value = null
  }
})
</script>