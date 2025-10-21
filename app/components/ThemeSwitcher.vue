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
      class="dropdown-content absolute right-0 z-[100] mt-2 w-72 sm:w-80 bg-base-200 shadow-2xl rounded-box p-4 border border-base-content/20 dark:border-base-content/40"
    >
      <div class="flex justify-between items-center mb-3 text-xs opacity-70">
        <span class="flex items-center gap-2">
          <span class="font-medium">Current:</span>
          <span class="badge badge-outline capitalize">{{ currentTheme || 'system' }}</span>
        </span>
        <button class="btn btn-ghost btn-xs" @click="resetTheme">System</button>
      </div>

      <div
        class="overflow-y-auto overscroll-contain snap-y snap-mandatory scroll-smooth pb-2 max-h-[24rem] flex flex-col gap-2 pr-1 rounded-box"
      >
        <button
          v-for="theme in allThemes"
          :key="theme"
          class="flex items-center justify-between p-3 rounded-lg bg-base-100 border border-transparent hover:border-primary hover:shadow transition-all snap-start"
          @click="applyTheme(theme)"
          :data-theme="theme"
        >
          <div class="flex items-center gap-2">
            <span class="capitalize font-medium text-sm">{{ theme }}</span>
          </div>
          <div class="flex items-center gap-1">
            <span
              v-for="(color, idx) in themePalettes.get(theme) || []"
              :key="idx"
              class="w-3 h-3 rounded-full border border-base-content/20"
              :style="{ backgroundColor: color }"
            ></span>
            <IconCheck v-if="theme === currentTheme" class="w-4 h-4 text-primary ml-1" />
          </div>
        </button>
        <div class="w-full h-2 shrink-0"></div>
      </div>

      <div class="flex justify-between items-center mt-4">
        <button class="btn btn-ghost btn-sm w-1/2" @click="showDropdown = false">Close</button>
        <button class="btn btn-primary btn-sm w-1/2" @click="randomizeTheme">Random</button>
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

        <div
          class="overflow-y-auto overscroll-contain snap-y snap-mandatory scroll-smooth pb-3 max-h-[60vh] flex flex-col gap-3 rounded-box"
        >
          <button
            v-for="theme in allThemes"
            :key="theme"
            class="flex items-center justify-between p-4 rounded-xl bg-base-100 border border-transparent hover:border-primary hover:shadow-md transition-all snap-start"
            :data-theme="theme"
            @click="applyTheme(theme)"
          >
            <span class="capitalize font-semibold">{{ theme }}</span>
            <div class="flex items-center gap-2">
              <span
                v-for="(color, idx) in themePalettes.get(theme) || []"
                :key="idx"
                class="w-4 h-4 rounded-full border border-base-content/20"
                :style="{ backgroundColor: color }"
              ></span>
              <IconCheck v-if="theme === currentTheme" class="w-5 h-5 text-primary" />
            </div>
          </button>
          <div class="w-full h-3 shrink-0"></div>
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
import { ref, onMounted } from 'vue'
import { useTheme } from '~/composables/useTheme'
import BaseModal from '~/components/BaseModal.vue'

const { currentTheme, setTheme, resetTheme, loadTheme } = useTheme()
const showDropdown = ref(false)
const showMobileModal = ref(false)
const allThemes = ref<string[]>([])
const themePalettes = ref<Map<string, string[]>>(new Map())
const isMobile = ref(false)

const defaultThemes = [
  'light','dark','cupcake','bumblebee','emerald','corporate','synthwave','retro','cyberpunk','valentine',
  'halloween','garden','forest','aqua','lofi','pastel','fantasy','wireframe','black','luxury',
  'dracula','cmyk','autumn','business','acid','lemonade','night','coffee','winter'
]

onMounted(() => {
  loadTheme()
  checkMobile()
  window.addEventListener('resize', checkMobile)
  if (typeof window !== 'undefined') {
    const daisyThemes = (window as any).daisyUIThemes
    allThemes.value = Array.isArray(daisyThemes) && daisyThemes.length ? daisyThemes : defaultThemes
    generateThemeSamples()
  }
})

function openModal() { showMobileModal.value = true }
function checkMobile() { isMobile.value = window.innerWidth < 768 }
function applyTheme(theme: string) {
  setTheme(theme)
  showDropdown.value = false
  showMobileModal.value = false
}
function randomizeTheme() {
  const list = allThemes.value
  if (!list.length) return
  const pick = list[Math.floor(Math.random() * list.length)]
  if (pick) setTheme(pick)
  showDropdown.value = false
  showMobileModal.value = false
}
function generateThemeSamples() {
  const temp = document.createElement('div')
  document.body.appendChild(temp)
  for (const theme of allThemes.value) {
    temp.setAttribute('data-theme', theme)
    const style = getComputedStyle(temp)
    const colors = [
      style.getPropertyValue('oklch(var(--p))'),
      style.getPropertyValue('oklch(var(--s))'),
      style.getPropertyValue('oklch(var(--a))'),
      style.getPropertyValue('oklch(var(--n))'),
      style.getPropertyValue('oklch(var(--b1))')
    ].filter(c => c.trim() !== '')
    themePalettes.value.set(theme, colors)
  }
  temp.remove()
}
</script>