<template>
  <div v-if="modelValue" class="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4" @click.self="close">
    <div class="bg-base-100 rounded-lg shadow-xl flex flex-col" :class="sizeClass" :style="modalStyle">
      <div class="p-4 sm:p-6 border-b border-base-300 flex items-center justify-between flex-shrink-0">
        <div class="flex-1 min-w-0">
          <h2 class="text-xl sm:text-2xl font-bold truncate">{{ title }}</h2>
          <p v-if="subtitle" class="text-sm text-base-content/60 mt-1 truncate">{{ subtitle }}</p>
        </div>
        <button @click="close" class="btn btn-ghost btn-sm btn-circle flex-shrink-0 ml-2">
          <IconX class="w-5 h-5" />
        </button>
      </div>

      <div class="flex-1 overflow-y-auto custom-scrollbar min-h-0">
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

const props = defineProps({
  modelValue: Boolean,
  title: String,
  subtitle: String,
  size: {
    type: String,
    default: 'lg',
    validator: (value) => ['sm', 'md', 'lg', 'xl', '2xl', '4xl'].includes(value)
  }
})

const emit = defineEmits(['update:modelValue'])

const sizeClass = computed(() => {
  const sizes = {
    sm: 'w-full max-w-md',
    md: 'w-full max-w-2xl',
    lg: 'w-full max-w-3xl',
    xl: 'w-full max-w-4xl',
    '2xl': 'w-full max-w-5xl',
    '4xl': 'w-full max-w-6xl'
  }
  return sizes[props.size]
})

const modalStyle = computed(() => {
  const heights = {
    sm: { height: '50vh', maxHeight: '600px' },
    md: { height: '65vh', maxHeight: '700px' },
    lg: { height: '75vh', maxHeight: '750px' },
    xl: { height: '85vh', maxHeight: '850px' },
    '2xl': { height: '90vh', maxHeight: '900px' },
    '4xl': { height: '90vh', maxHeight: '950px' }
  }
  return heights[props.size]
})

const close = () => {
  emit('update:modelValue', false)
}
</script>