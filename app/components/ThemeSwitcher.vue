<!-- app/components/ThemeSwitcher.vue -->
<template>
  <div class="relative">
    <button
      class="btn btn-ghost btn-sm gap-2 h-10 px-4 z-50 flex items-center"
      @click.stop="toggleDropdown"
    >
      <IconPalette class="w-5 h-5 flex-shrink-0" />
      <span class="hidden md:inline">Theme</span>
    </button>

    <!-- Desktop Dropdown -->
    <div
      v-show="showDropdown"
      tabindex="0"
      class="hidden md:block dropdown-content z-[100] p-3 sm:p-4 shadow-2xl bg-base-300 rounded-box w-80 sm:w-[32rem] mt-2 max-h-[32rem] overflow-hidden flex flex-col gap-3 absolute right-0"
      @click.stop
    >
      <div class="flex flex-col sm:flex-row gap-2 items-stretch">
        <div class="join grow">
          <input
            v-model="query"
            type="text"
            placeholder="Search themes..."
            class="input input-sm input-bordered join-item w-full"
          />
          <button class="btn btn-sm join-item" @click="query = ''" :disabled="!query">Clear</button>
        </div>
        <div class="flex gap-2 shrink-0">
          <button class="btn btn-sm" @click="randomizeFromList" :disabled="filteredThemes.length === 0">
            Random
          </button>
        </div>
      </div>

      <div class="text-xs opacity-70 flex items-center gap-2">
        <span class="inline-flex items-center gap-2">
          <span class="font-medium">Current:</span>
          <span class="badge badge-ghost capitalize">{{ currentTheme || 'system' }}</span>
        </span>
        <button class="btn btn-ghost btn-xs ml-auto" @click="resetToSystem">
          System default
        </button>
      </div>

      <div class="overflow-y-auto min-h-0 grow pr-1">
        <ul class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          <li v-for="t in filteredThemes" :key="t.value">
            <button
              @click="handleThemeChange(t.value)"
              class="btn btn-ghost btn-sm w-full justify-between h-auto px-3 py-2 border border-transparent hover:border-base-content/10 transition-colors"
              :class="currentTheme === t.value ? 'btn-active' : ''"
              :data-theme="t.value"
            >
              <div class="flex items-start gap-2 w-full">
                <ThemeSwatch :theme="t.value" class="mt-0.5" />

                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2">
                    <div class="font-medium capitalize truncate">{{ t.name }}</div>
                    <div class="text-[11px] opacity-70 truncate hidden sm:inline">{{ t.value }}</div>
                  </div>
                  <ThemePalette :theme="t.value" />
                </div>

                <IconCheck
                  v-if="currentTheme === t.value"
                  class="w-4 h-4 flex-shrink-0 text-primary mt-1"
                />
              </div>
            </button>
          </li>
        </ul>

        <div v-if="!filteredThemes.length" class="py-8 text-center text-sm opacity-70">
          No themes found
        </div>
      </div>

      <div class="flex items-center justify-between pt-1">
        <button class="btn btn-ghost btn-sm" @click="closeAll">Close</button>
        <div class="text-xs opacity-60">
          {{ filteredThemes.length }} themes
        </div>
      </div>
    </div>

    <!-- Mobile Modal -->
    <dialog :open="showModal" class="modal modal-bottom md:hidden">
      <div class="modal-box w-full max-h-[90vh] flex flex-col gap-4">
        <h3 class="font-bold text-lg">Select Theme</h3>

        <div class="flex flex-col gap-2">
          <div class="join w-full">
            <input
              v-model="query"
              type="text"
              placeholder="Search themes..."
              class="input input-sm input-bordered join-item w-full"
            />
            <button class="btn btn-sm join-item" @click="query = ''" :disabled="!query">Clear</button>
          </div>
          <button class="btn btn-sm w-full" @click="randomizeFromList" :disabled="filteredThemes.length === 0">
            Random
          </button>
        </div>

        <div class="text-xs opacity-70 flex items-center justify-between">
          <span class="inline-flex items-center gap-2">
            <span class="font-medium">Current:</span>
            <span class="badge badge-ghost capitalize">{{ currentTheme || 'system' }}</span>
          </span>
          <button class="btn btn-ghost btn-xs" @click="resetToSystem">
            System default
          </button>
        </div>

        <div class="overflow-y-auto min-h-0 flex-1 pr-2">
          <ul class="grid grid-cols-1 gap-2">
            <li v-for="t in filteredThemes" :key="t.value">
              <button
                @click="handleThemeChange(t.value)"
                class="btn btn-ghost btn-sm w-full justify-start h-auto px-3 py-2 border border-transparent hover:border-base-content/10"
                :class="currentTheme === t.value ? 'btn-active' : ''"
                :data-theme="t.value"
              >
                <div class="flex items-start gap-3 w-full">
                  <ThemeSwatch :theme="t.value" class="mt-0.5" />

                  <div class="flex-1 min-w-0 text-left">
                    <div class="font-medium capitalize">{{ t.name }}</div>
                    <div class="text-[11px] opacity-70">{{ t.value }}</div>
                    <ThemePalette :theme="t.value" />
                  </div>

                  <IconCheck
                    v-if="currentTheme === t.value"
                    class="w-4 h-4 flex-shrink-0 text-primary mt-1"
                  />
                </div>
              </button>
            </li>
          </ul>

          <div v-if="!filteredThemes.length" class="py-8 text-center text-sm opacity-70">
            No themes found
          </div>
        </div>

        <div class="modal-action">
          <form method="dialog" @submit.prevent="closeAll">
            <button class="btn btn-ghost" @click.prevent="closeAll">Close</button>
          </form>
          <div class="text-xs opacity-60">{{ filteredThemes.length }} themes</div>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop" @submit.prevent="closeAll">
        <button @click.prevent="closeAll">close</button>
      </form>
    </dialog>

    <!-- Backdrop for desktop dropdown -->
    <div v-if="showDropdown" class="fixed inset-0 z-[99]" @click.stop="closeAll"></div>
  </div>
</template>

<script setup lang="ts">
import IconPalette from '~icons/lucide/palette'
import IconCheck from '~icons/lucide/check'
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'

interface Theme {
  name: string
  value: string
}

interface Props {
  currentTheme: string
}

defineProps<Props>()
const emit = defineEmits<{
  'update:theme': [theme: string]
}>()

const route = useRoute()

const THEME_NAMES = [
  'light', 'dark', 'cupcake', 'bumblebee', 'emerald', 'corporate', 'synthwave', 'retro',
  'cyberpunk', 'valentine', 'halloween', 'garden', 'forest', 'aqua', 'lofi', 'pastel',
  'fantasy', 'wireframe', 'black', 'luxury', 'dracula', 'cmyk', 'autumn', 'business',
  'acid', 'lemonade', 'night', 'coffee', 'winter', 'dim', 'nord', 'sunset',
  'caramelLatte', 'abyss'
]

const showDropdown = ref<boolean>(false)
const showModal = ref<boolean>(false)
const query = ref<string>('')

function toTitle(v: string): string {
  return v
    .replace(/[-_]+/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, (m: string) => m.toUpperCase())
}

const allThemes = computed((): Theme[] =>
  THEME_NAMES
    .map((n) => ({ name: toTitle(n), value: n }))
    .sort((a, b) => a.name.localeCompare(b.name))
)

const filteredThemes = computed((): Theme[] => {
  const q = query.value.trim().toLowerCase()
  if (!q) return allThemes.value
  return allThemes.value.filter((t) => t.name.toLowerCase().includes(q) || t.value.toLowerCase().includes(q))
})

const closeAll = (): void => {
  showDropdown.value = false
  showModal.value = false
  query.value = ''
}

const toggleDropdown = (): void => {
  if (typeof window === 'undefined') return
  if (window.innerWidth < 768) {
    showModal.value = !showModal.value
    if (!showModal.value) query.value = ''
  } else {
    showDropdown.value = !showDropdown.value
    if (!showDropdown.value) query.value = ''
  }
}

const handleThemeChange = (theme: string): void => {
  emit('update:theme', theme)
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', theme)
  }
  try {
    localStorage.setItem('theme', theme)
  } catch (e) {
    console.error('Failed to save theme:', e)
  }
  closeAll()
}

const resetToSystem = (): void => {
  emit('update:theme', '')
  if (typeof document !== 'undefined') {
    document.documentElement.removeAttribute('data-theme')
  }
  try {
    localStorage.removeItem('theme')
  } catch (e) {
    console.error('Failed to remove theme:', e)
  }
  closeAll()
}

const randomizeFromList = (): void => {
  const arr = filteredThemes.value.length ? filteredThemes.value : allThemes.value
  if (!arr.length) return
  const pick = arr[Math.floor(Math.random() * arr.length)]
  if (!pick) return
  handleThemeChange(pick.value)
}

watch(showModal, (newVal) => {
  if (!newVal) {
    query.value = ''
  }
})

watch(() => route.path, () => {
  closeAll()
})

const onKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape') {
    closeAll()
  }
}

onMounted(() => {
  if (typeof window !== 'undefined') {
    window.addEventListener('keydown', onKeydown)
  }
})

onUnmounted(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('keydown', onKeydown)
  }
})
</script>

<style scoped>
button.btn.btn-ghost:hover {
  transform: translateY(-1px);
  transition: transform 150ms ease;
}

::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}
::-webkit-scrollbar-thumb {
  background-color: color-mix(in oklab, currentColor 20%, transparent);
  border-radius: 9999px;
}

.theme-swatch {
  --bg: oklch(from var(--b1) l c h);
  background-color: var(--b2, var(--bg));
  border: 1px solid color-mix(in oklab, currentColor 15%, transparent);
  border-radius: 10px;
  width: 30px;
  height: 22px;
}
</style>