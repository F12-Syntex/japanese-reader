<template>
  <div class="relative">
    <div class="dropdown dropdown-end">
      <label tabindex="0" class="btn btn-ghost btn-sm gap-2 h-10 px-4 m-2">
        <IconPalette class="w-5 h-5 flex-shrink-0" />
        <span class="hidden sm:inline">Theme</span>
      </label>

      <div
        tabindex="0"
        class="dropdown-content z-[100] p-3 sm:p-4 shadow-2xl bg-base-300 rounded-box w-80 sm:w-[32rem] mt-2 max-h-[32rem] overflow-hidden flex flex-col gap-3"
      >
        <!-- Header actions -->
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

        <!-- Current theme -->
        <div class="text-xs opacity-70 flex items-center gap-2">
          <span class="inline-flex items-center gap-2">
            <span class="font-medium">Current:</span>
            <span class="badge badge-ghost capitalize">{{ currentTheme || 'system' }}</span>
          </span>
          <button class="btn btn-ghost btn-xs ml-auto" @click="resetToSystem">
            System default
          </button>
        </div>

        <!-- Themes list -->
        <div class="overflow-y-auto min-h-0 grow pr-1">
          <ul class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            <li v-for="t in filteredThemes" :key="t.value">
              <button
                @click="handleThemeChange(t.value)"
                class="btn btn-ghost btn-sm w-full justify-between h-auto px-3 py-2 border border-transparent hover:border-base-content/10 transition-colors"
                :class="currentTheme === t.value ? 'btn-active' : ''"
                :data-theme="t.value"
                :title="`Apply ${t.name} theme`"
              >
                <div class="flex items-start gap-2 w-full">
                  <!-- Enlarged swatch -->
                  <ThemeSwatch :theme="t.value" class="mt-0.5" />

                  <!-- Name + palette -->
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2">
                      <div class="font-medium capitalize truncate">{{ t.name }}</div>
                      <div class="text-[11px] opacity-70 truncate hidden sm:inline">{{ t.value }}</div>
                    </div>

                    <!-- Color palette preview -->
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

        <!-- Footer -->
        <div class="flex items-center justify-between pt-1">
          <button class="btn btn-ghost btn-sm" @click="closeDropdown">Close</button>
          <div class="text-xs opacity-60">
            {{ filteredThemes.length }} themes
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import IconPalette from '~icons/lucide/palette'
import IconCheck from '~icons/lucide/check'
import { ref, computed } from 'vue'

const props = defineProps({
  currentTheme: {
    type: String,
    required: true
  }
})
const emit = defineEmits(['update:theme'])

const THEME_NAMES = [
  'light',
  'dark',
  'cupcake',
  'bumblebee',
  'emerald',
  'corporate',
  'synthwave',
  'retro',
  'cyberpunk',
  'valentine',
  'halloween',
  'garden',
  'forest',
  'aqua',
  'lofi',
  'pastel',
  'fantasy',
  'wireframe',
  'black',
  'luxury',
  'dracula',
  'cmyk',
  'autumn',
  'business',
  'acid',
  'lemonade',
  'night',
  'coffee',
  'winter',
  'dim',
  'nord',
  'sunset',
  'caramelLatte',
  'abyss'
]

function toTitle(v) {
  return String(v)
    .replace(/[-_]+/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, (m) => m.toUpperCase())
}

const allThemes = ref(
  THEME_NAMES
    .map((n) => ({ name: toTitle(n), value: n }))
    .sort((a, b) => a.name.localeCompare(b.name))
)

const query = ref('')

const filteredThemes = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return allThemes.value
  return allThemes.value.filter((t) => t.name.toLowerCase().includes(q) || t.value.toLowerCase().includes(q))
})

function handleThemeChange(theme) {
  emit('update:theme', theme)
  try { localStorage.setItem('theme', theme) } catch {}
  closeDropdown()
}

function resetToSystem() {
  emit('update:theme', '')
  if (typeof document !== 'undefined') {
    document.documentElement.removeAttribute('data-theme')
  }
  try { localStorage.removeItem('theme') } catch {}
  closeDropdown()
}

function randomizeFromList() {
  const arr = filteredThemes.value.length ? filteredThemes.value : allThemes.value
  if (!arr.length) return
  const pick = arr[Math.floor(Math.random() * arr.length)]
  handleThemeChange(pick.value)
}

function closeDropdown() {
  if (typeof document !== 'undefined') {
    document.activeElement?.blur()
  }
}
</script>

<script>
export default {
  name: 'ThemeSwitcher',
  components: {
    ThemeSwatch: {
      name: 'ThemeSwatch',
      props: { theme: { type: String, required: true } },
      template: `
        <div class="relative inline-flex items-center justify-center">
          <div class="theme-swatch" :data-theme="theme" :title="theme">
            <span class="dot dot-a"></span>
            <span class="dot dot-b"></span>
            <span class="dot dot-c"></span>
            <span class="dot dot-d"></span>
          </div>
        </div>
      `
    },
    ThemePalette: {
      name: 'ThemePalette',
      props: { theme: { type: String, required: true } },
      template: `
        <div class="palette" :data-theme="theme" aria-hidden="true">
          <div class="row">
            <span class="swatch" data-k="--p" title="Primary"></span>
            <span class="swatch" data-k="--s" title="Secondary"></span>
            <span class="swatch" data-k="--a" title="Accent"></span>
            <span class="swatch" data-k="--n" title="Neutral"></span>
            <span class="swatch" data-k="--b1" title="Base 1"></span>
          </div>
          <div class="row subtle">
            <span class="pill" data-k="--in" title="Info">I</span>
            <span class="pill" data-k="--su" title="Success">S</span>
            <span class="pill" data-k="--wa" title="Warning">W</span>
            <span class="pill" data-k="--er" title="Error">E</span>
          </div>
        </div>
      `
    }
  }
}
</script>

<style scoped>
/* Subtle motion on hover */
button.btn.btn-ghost:hover {
  transform: translateY(-1px);
  transition: transform 150ms ease;
}

/* Nice thin scrollbars */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}
::-webkit-scrollbar-thumb {
  background-color: color-mix(in oklab, currentColor 20%, transparent);
  border-radius: 9999px;
}

/* Theme swatch styles (square 2x2) */
.theme-swatch {
  --bg: oklch(from var(--b1) l c h);
  background-color: var(--b2, var(--bg));
  border: 1px solid color-mix(in oklab, currentColor 15%, transparent);
  border-radius: 10px;
  width: 30px;
  height: 30px;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  grid-template-rows: repeat(2, 1fr);
  gap: 3px;
  padding: 4px;
  flex-shrink: 0;
}
.theme-swatch .dot {
  display: inline-block;
  border-radius: 9999px;
  width: 9px;
  height: 9px;
  box-shadow: 0 0 0 1px color-mix(in oklab, black 12%, transparent) inset;
}
.theme-swatch .dot-a { background-color: var(--p); } /* primary */
.theme-swatch .dot-b { background-color: var(--s); } /* secondary */
.theme-swatch .dot-c { background-color: var(--a); } /* accent */
.theme-swatch .dot-d { background-color: var(--n); } /* neutral */

/* Palette preview */
.palette {
  margin-top: 6px;
  display: grid;
  gap: 6px;
}
.palette .row {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 6px;
}
.palette .swatch {
  display: block;
  height: 14px;
  border-radius: 6px;
  background-color: var(--b2);
  border: 1px solid color-mix(in oklab, currentColor 15%, transparent);
  box-shadow: inset 0 0 0 1px color-mix(in oklab, black 10%, transparent);
}
.palette .swatch[data-k="--p"] { background-color: var(--p); }
.palette .swatch[data-k="--s"] { background-color: var(--s); }
.palette .swatch[data-k="--a"] { background-color: var(--a); }
.palette .swatch[data-k="--n"] { background-color: var(--n); }
.palette .swatch[data-k="--b1"] { background-color: var(--b1); }

.palette .row.subtle {
  grid-template-columns: repeat(4, max-content);
  align-items: center;
  gap: 8px;
}
.palette .pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 18px;
  padding: 0 8px;
  border-radius: 9999px;
  font-size: 10px;
  font-weight: 600;
  color: oklch(97% 0 0 / 0.96);
  background-color: var(--b3);
  border: 1px solid color-mix(in oklab, currentColor 15%, transparent);
  box-shadow: 0 0 0 1px color-mix(in oklab, black 10%, transparent) inset;
}
.palette .pill[data-k="--in"] { background-color: var(--in); color: var(--inc, #000); }
.palette .pill[data-k="--su"] { background-color: var(--su); color: var(--suc, #000); }
.palette .pill[data-k="--wa"] { background-color: var(--wa); color: var(--wac, #000); }
.palette .pill[data-k="--er"] { background-color: var(--er); color: var(--erc, #fff); }

/* Improve density on small screens */
@media (max-width: 640px) {
  .theme-swatch { width: 28px; height: 28px; }
  .theme-swatch .dot { width: 8px; height: 8px; }
  .palette .swatch { height: 12px; }
}
</style>