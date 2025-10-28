<template>
  <div class="relative">
    <button
      class="btn btn-ghost btn-sm gap-2 h-10 px-4 flex items-center"
      @click="isMobile ? openModal() : (showDropdown = !showDropdown)"
    >
      <IconPalette class="w-5 h-5 flex-shrink-0" />
      <span class="hidden md:inline">Theme</span>
    </button>

    <div
      v-if="showDropdown && !isMobile"
      class="dropdown-content absolute right-0 z-[100] mt-2 w-[500px] bg-base-200 shadow-2xl rounded-box p-4 border border-base-content/20 dark:border-base-content/40"
    >
      <div class="flex justify-between items-center mb-3 text-xs opacity-70">
        <span class="flex items-center gap-2">
          <span class="font-medium">Current:</span>
          <span class="badge badge-outline capitalize">{{ currentTheme || 'system' }}</span>
        </span>
        <button class="btn btn-ghost btn-xs" @click="resetTheme">System</button>
      </div>

      <div class="mb-3">
        <input 
          v-model="searchQuery"
          type="text" 
          placeholder="Search themes..." 
          class="input input-bordered input-sm w-full"
        />
      </div>

      <div class="overflow-y-auto max-h-[400px] px-1">
        <div class="grid grid-cols-3 gap-3 pb-2">
          <button
            v-for="theme in filteredThemes"
            :key="theme"
            @click="applyTheme(theme)"
            :data-theme="theme"
            class="relative group overflow-hidden rounded-xl transition-all duration-300 hover:scale-105"
            :class="currentTheme === theme ? 'ring-4 ring-primary shadow-xl' : 'hover:shadow-lg'"
          >
            <div class="bg-base-100 p-3 h-full flex flex-col gap-2 border border-base-300">
              <div class="flex gap-1.5 mb-1">
                <div class="w-2 h-2 rounded-full bg-primary"></div>
                <div class="w-2 h-2 rounded-full bg-secondary"></div>
                <div class="w-2 h-2 rounded-full bg-accent"></div>
              </div>
              <div class="space-y-1 flex-1">
                <div class="h-1.5 bg-base-content/20 rounded w-3/4"></div>
                <div class="h-1.5 bg-base-content/10 rounded w-1/2"></div>
              </div>
              <div class="pt-2 border-t border-base-300">
                <p class="text-xs font-semibold text-base-content capitalize truncate">{{ theme }}</p>
              </div>
              <div 
                v-if="currentTheme === theme" 
                class="absolute top-2 right-2 bg-primary text-primary-content rounded-full p-1"
              >
                <IconCheck class="h-3 w-3" />
              </div>
            </div>
          </button>
        </div>
      </div>

      <div class="flex gap-2 mt-4">
        <button class="btn btn-ghost btn-sm flex-1" @click="showDropdown = false">Close</button>
        <button class="btn btn-primary btn-sm flex-1" @click="randomizeTheme">Random</button>
      </div>
    </div>

    <BaseModal v-model="showMobileModal" title="Choose Theme" size="md">
      <div class="flex flex-col gap-3">
        <div class="flex justify-between items-center text-sm opacity-70">
          <span class="flex items-center gap-2">
            <span class="font-medium">Current:</span>
            <span class="badge badge-outline capitalize">{{ currentTheme || 'system' }}</span>
          </span>
          <button class="btn btn-ghost btn-xs" @click="resetTheme">System</button>
        </div>

        <div class="mb-2">
          <input 
            v-model="searchQuery"
            type="text" 
            placeholder="Search themes..." 
            class="input input-bordered w-full"
          />
        </div>

        <div class="overflow-y-auto max-h-[60vh] px-1">
          <div class="grid grid-cols-2 gap-3 pb-3">
            <button
              v-for="theme in filteredThemes"
              :key="theme"
              @click="applyTheme(theme)"
              :data-theme="theme"
              class="relative group overflow-hidden rounded-2xl transition-all duration-300 hover:scale-105"
              :class="currentTheme === theme ? 'ring-4 ring-primary shadow-xl' : 'hover:shadow-lg'"
            >
              <div class="bg-base-100 p-4 h-full flex flex-col gap-2 border border-base-300">
                <div class="flex gap-1.5 mb-2">
                  <div class="w-2 h-2 rounded-full bg-primary"></div>
                  <div class="w-2 h-2 rounded-full bg-secondary"></div>
                  <div class="w-2 h-2 rounded-full bg-accent"></div>
                </div>
                <div class="space-y-1.5 flex-1">
                  <div class="h-2 bg-base-content/20 rounded w-3/4"></div>
                  <div class="h-2 bg-base-content/10 rounded w-1/2"></div>
                </div>
                <div class="pt-2 border-t border-base-300">
                  <p class="text-sm font-semibold text-base-content capitalize truncate">{{ theme }}</p>
                </div>
                <div 
                  v-if="currentTheme === theme" 
                  class="absolute top-2 right-2 bg-primary text-primary-content rounded-full p-1"
                >
                  <IconCheck class="h-4 w-4" />
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="flex gap-3 w-full">
          <button class="btn btn-outline flex-1" @click="resetTheme">System</button>
          <button class="btn btn-primary flex-1" @click="randomizeTheme">Random</button>
        </div>
      </template>
    </BaseModal>

    <div v-if="showDropdown" class="fixed inset-0 z-[90]" @click="showDropdown = false"></div>
  </div>
</template>

<script setup lang="ts">
import IconPalette from '~icons/lucide/palette'
import IconCheck from '~icons/lucide/check'
import { ref, computed, onMounted } from 'vue'
import { useTheme } from '~/composables/useTheme'
import BaseModal from '~/components/BaseModal.vue'

const { currentTheme, setTheme, resetTheme, loadTheme } = useTheme()
const showDropdown = ref(false)
const showMobileModal = ref(false)
const allThemes = ref<string[]>([])
const isMobile = ref(false)
const searchQuery = ref('')

const defaultThemes = [
  'light','dark','cupcake','bumblebee','emerald','corporate','synthwave','retro','cyberpunk','valentine',
  'halloween','garden','forest','aqua','lofi','pastel','fantasy','wireframe','black','luxury',
  'dracula','cmyk','autumn','business','acid','lemonade','night','coffee','winter'
]

const filteredThemes = computed(() => {
  if (!searchQuery.value) return allThemes.value
  return allThemes.value.filter(t => t.toLowerCase().includes(searchQuery.value.toLowerCase()))
})

onMounted(() => {
  loadTheme()
  checkMobile()
  window.addEventListener('resize', checkMobile)
  if (typeof window !== 'undefined') {
    const daisyThemes = (window as any).daisyUIThemes
    allThemes.value = Array.isArray(daisyThemes) && daisyThemes.length ? daisyThemes : defaultThemes
  }
})

function openModal() { 
  showMobileModal.value = true 
  searchQuery.value = ''
}

function checkMobile() { 
  isMobile.value = window.innerWidth < 768 
}

function applyTheme(theme: string) {
  setTheme(theme)
  showDropdown.value = false
  showMobileModal.value = false
  searchQuery.value = ''
}

function randomizeTheme() {
  const list = allThemes.value
  if (!list.length) return
  const pick = list[Math.floor(Math.random() * list.length)]
  if (pick) setTheme(pick)
  showDropdown.value = false
  showMobileModal.value = false
  searchQuery.value = ''
}
</script>