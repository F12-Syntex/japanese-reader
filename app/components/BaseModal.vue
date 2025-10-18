<template>
  <div v-if="modelValue" class="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4" @click.self="close">
    <div class="bg-base-100 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
      <div class="p-4 sm:p-6 border-b border-base-300 flex items-center justify-between flex-shrink-0">
        <div class="flex-1">
          <h2 class="text-xl sm:text-2xl font-bold">{{ title }}</h2>
          <p v-if="subtitle" class="text-sm text-base-content/60 mt-1">{{ subtitle }}</p>
        </div>
        <button @click="close" class="btn btn-ghost btn-sm btn-circle">
          <IconX class="w-5 h-5" />
        </button>
      </div>

      <div class="flex-1 overflow-y-auto custom-scrollbar">
        <slot />
      </div>

      <div v-if="$slots.footer" class="p-4 sm:p-6 border-t border-base-300 flex gap-3 justify-end flex-shrink-0">
        <slot name="footer" />
      </div>
    </div>
  </div>
</template>

<script setup>
import IconX from '~icons/lucide/x'

defineProps({
  modelValue: Boolean,
  title: String,
  subtitle: String
})

const emit = defineEmits(['update:modelValue'])

const close = () => {
  emit('update:modelValue', false)
}
</script>