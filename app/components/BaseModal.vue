<template>
  <teleport to="body">
    <transition
      enter-active-class="transition duration-300"
      leave-active-class="transition duration-300"
      enter-from-class="opacity-0"
      leave-to-class="opacity-0"
    >
      <div v-if="modelValue" class="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50" @click.self="close">
        <transition
          enter-active-class="transition duration-300 transform"
          leave-active-class="transition duration-300 transform"
          enter-from-class="translate-y-full sm:translate-y-0 sm:scale-95 opacity-0"
          leave-to-class="translate-y-full sm:translate-y-0 sm:scale-95 opacity-0"
        >
          <div v-if="modelValue" class="bg-base-100 rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:w-auto" :class="sizeClass" :style="modalStyle">
            <div class="sticky top-0 z-10 p-4 sm:p-6 border-b border-base-200 bg-base-100 rounded-t-3xl sm:rounded-t-2xl flex items-center justify-between">
              <div class="flex-1 min-w-0">
                <h2 class="text-lg sm:text-2xl font-bold">{{ title }}</h2>
                <p v-if="subtitle" class="text-xs sm:text-sm text-base-content/60 mt-1">{{ subtitle }}</p>
              </div>
              <button @click="close" class="btn btn-ghost btn-sm btn-circle ml-2 flex-shrink-0">
                <IconX class="w-5 h-5" />
              </button>
            </div>

            <div class="overflow-y-auto px-4 sm:px-6 py-4 sm:py-6 custom-scrollbar" :style="{ maxHeight: `calc(${getMaxHeight()} - 120px)` }">
              <slot />
            </div>

            <div v-if="$slots.footer" class="sticky bottom-0 p-4 sm:p-6 border-t border-base-200 bg-base-100 flex gap-2 sm:gap-3 justify-end flex-wrap sm:flex-nowrap">
              <slot name="footer" />
            </div>
          </div>
        </transition>
      </div>
    </transition>
  </teleport>
</template>

<script setup lang="ts">
import IconX from '~icons/lucide/x'

interface Props {
  modelValue: boolean
  title: string
  subtitle?: string
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl'
}

const props = withDefaults(defineProps<Props>(), {
  size: 'lg',
  subtitle: undefined
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const sizeClass = computed((): string => {
  const sizes: Record<string, string> = {
    sm: 'sm:max-w-md',
    md: 'sm:max-w-2xl',
    lg: 'sm:max-w-3xl',
    xl: 'sm:max-w-4xl',
    '2xl': 'sm:max-w-5xl',
    '4xl': 'sm:max-w-6xl'
  }
  return sizes[props.size] ?? 'sm:max-w-3xl'
})

const modalStyle = computed((): Record<string, string> => {
  const heights: Record<string, string> = {
    sm: '45vh',
    md: '55vh',
    lg: '65vh',
    xl: '75vh',
    '2xl': '80vh',
    '4xl': '85vh'
  }
  return {
    height: heights[props.size] ?? '65vh',
    maxHeight: '90vh'
  }
})

const getMaxHeight = (): string => {
  const heights: Record<string, string> = {
    sm: '600px',
    md: '700px',
    lg: '750px',
    xl: '850px',
    '2xl': '900px',
    '4xl': '950px'
  }
  return heights[props.size] ?? '750px'
}

const close = (): void => {
  emit('update:modelValue', false)
}
</script>