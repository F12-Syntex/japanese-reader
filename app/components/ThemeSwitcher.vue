<template>
  <div class="dropdown dropdown-end">
    <label tabindex="0" class="btn btn-ghost btn-sm gap-2 h-10 px-4 m-2">
      <IconPalette class="w-5 h-5 flex-shrink-0" />
      <span class="hidden sm:inline">Theme</span>
    </label>
    <ul tabindex="0" class="dropdown-content z-[1] p-2 shadow-2xl bg-base-300 rounded-box w-52 mt-2 max-h-96 overflow-y-auto">
      <li v-for="theme in themes" :key="theme.value">
        <button 
          @click="handleThemeChange(theme.value)"
          class="btn btn-sm btn-block btn-ghost justify-start capitalize h-10"
          :class="{ 'btn-active': currentTheme === theme.value }"
        >
          <IconCheck v-if="currentTheme === theme.value" class="w-4 h-4 flex-shrink-0" />
          <span class="w-4 flex-shrink-0" v-else></span>
          <span class="truncate">{{ theme.name }}</span>
        </button>
      </li>
    </ul>
  </div>
</template>

<script setup>
import IconPalette from '~icons/lucide/palette'
import IconCheck from '~icons/lucide/check'

const themes = [
  { name: 'Light', value: 'light' },
  { name: 'Dark', value: 'dark' },
  { name: 'Forest', value: 'forest' },
  { name: 'Dracula', value: 'dracula' },
  { name: 'Night', value: 'night' }
]

const props = defineProps({
  currentTheme: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['update:theme'])

const handleThemeChange = (theme) => {
  emit('update:theme', theme)
  // Close dropdown after selection
  if (typeof document !== 'undefined') {
    document.activeElement?.blur()
  }
}
</script>