<template>
  <div v-if="modelValue" class="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50" @click.self="close">
    <div
      class="bg-base-100 rounded-t-2xl sm:rounded-lg shadow-xl transform transition-all duration-300 ease-out w-full sm:w-auto"
      :class="[sizeClass, mobileAnimation]"
      :style="modalStyle"
    >
      <div class="p-4 sm:p-6 border-b border-base-300 flex items-center justify-between">
        <div class="flex-1 min-w-0">
          <h2 class="text-lg sm:text-2xl font-bold truncate">{{ title }}</h2>
          <p v-if="subtitle" class="text-sm text-base-content/60 mt-1 truncate">{{ subtitle }}</p>
        </div>
        <button @click="close" class="btn btn-ghost btn-sm btn-circle ml-2">
          <IconX class="w-5 h-5" />
        </button>
      </div>

      <div class="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-6">
        <slot />
      </div>

      <div v-if="$slots.footer" class="p-4 sm:p-6 border-t border-base-300 flex gap-3 justify-end">
        <slot name="footer" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import IconX from '~icons/lucide/x'

const props = defineProps({
  modelValue: Boolean,
  title: String,
  subtitle: String,
  size: {
    type: String,
    default: 'lg',
    validator: (v: string) => ['sm', 'md', 'lg', 'xl', '2xl', '4xl'].includes(v)
  }
})

const emit = defineEmits(['update:modelValue'])

const sizeClass = computed(() => {
  const sizes: Record<string, string> = {
    sm: 'sm:max-w-md',
    md: 'sm:max-w-2xl',
    lg: 'sm:max-w-3xl',
    xl: 'sm:max-w-4xl',
    '2xl': 'sm:max-w-5xl',
    '4xl': 'sm:max-w-6xl'
  }
  return sizes[props.size]
})

const modalStyle = computed(() => {
  const heights: Record<string, Record<string, string>> = {
    sm: { height: '45vh', maxHeight: '600px' },
    md: { height: '55vh', maxHeight: '700px' },
    lg: { height: '65vh', maxHeight: '750px' },
    xl: { height: '75vh', maxHeight: '850px' },
    '2xl': { height: '80vh', maxHeight: '900px' },
    '4xl': { height: '85vh', maxHeight: '950px' }
  }
  return heights[props.size]
})

const mobileAnimation = ref('translate-y-full sm:translate-y-0 opacity-0')

onMounted(() => {
  requestAnimationFrame(() => {
    mobileAnimation.value = 'translate-y-0 opacity-100'
  })
})

const close = () => {
  mobileAnimation.value = 'translate-y-full sm:translate-y-0 opacity-0'
  setTimeout(() => emit('update:modelValue', false), 200)
}
</script>