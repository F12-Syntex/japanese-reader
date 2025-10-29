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
          <div v-if="modelValue" class="bg-base-100 rounded-t-3xl sm:rounded-2xl shadow-2xl w-full overflow-hidden flex flex-col h-[85vh] sm:h-auto" :class="sizeClass" :style="dimensionStyle">
            <div class="flex-shrink-0 p-4 sm:p-6 border-b border-base-200 bg-base-100 flex items-center justify-between">
              <div class="flex-1 min-w-0">
                <h2 class="text-lg sm:text-2xl font-bold">{{ title }}</h2>
                <p v-if="subtitle" class="text-xs sm:text-sm text-base-content/60 mt-1">{{ subtitle }}</p>
              </div>
              <button @click="close" class="btn btn-ghost btn-sm btn-circle ml-2 flex-shrink-0">
                <IconX class="w-5 h-5" />
              </button>
            </div>

            <div class="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-6 min-h-0">
              <slot />
            </div>

            <div v-if="$slots.footer" class="flex-shrink-0 p-4 sm:p-6 border-t border-base-200 bg-base-100 flex gap-2 sm:gap-3 justify-end flex-wrap sm:flex-nowrap">
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
  fixedHeight?: string
}

const props = withDefaults(defineProps<Props>(), {
  size: 'lg',
  subtitle: undefined,
  fixedHeight: undefined
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const sizeClass = computed((): string => {
  const sizes: Record<string, string> = {
    sm: 'sm:max-w-md',
    md: 'sm:max-w-xl',
    lg: 'sm:max-w-2xl',
    xl: 'sm:max-w-4xl',
    '2xl': 'sm:max-w-6xl',
    '4xl': 'sm:max-w-7xl'
  }
  return sizes[props.size] ?? 'sm:max-w-2xl'
})

const dimensionStyle = computed((): string => {
  if (props.fixedHeight) {
    return `height: ${props.fixedHeight}; max-height: ${props.fixedHeight};`
  }
  return ''
})

const close = (): void => {
  emit('update:modelValue', false)
}
</script>