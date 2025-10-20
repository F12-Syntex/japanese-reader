<template>
  <div class="space-y-6">
    <div class="space-y-4">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-base font-bold flex items-center gap-2">
          <IconType class="w-4 h-4" />
          Font Settings
        </h3>
        <button @click="openMarketplace" class="btn btn-sm gap-2">
          <IconShoppingBag class="w-4 h-4" />
          Browse Marketplace
        </button>
      </div>

      <div class="form-control">
        <label class="label">
          <span class="label-text font-medium text-sm">Font Family</span>
        </label>
        <select v-model="settings.fontFamily" class="select select-bordered select-sm w-full">
          <option v-for="font in installedFonts" :key="font.value" :value="font.value">
            {{ font.name }}
          </option>
        </select>
      </div>

      <div class="form-control">
        <label class="label">
          <span class="label-text font-medium text-sm">Size</span>
          <span class="label-text-alt font-mono text-xs">{{ settings.fontSize }}px</span>
        </label>
        <input v-model.number="settings.fontSize" type="range" min="14" max="64" class="range range-primary range-xs" />
      </div>

      <div class="form-control">
        <label class="label">
          <span class="label-text font-medium text-sm">Weight</span>
          <span class="label-text-alt font-mono text-xs">{{ settings.fontWeight }}</span>
        </label>
        <input v-model.number="settings.fontWeight" type="range" min="300" max="700" step="100" class="range range-primary range-xs" />
      </div>

      <div class="form-control">
        <label class="label">
          <span class="label-text font-medium text-sm">Line Height</span>
          <span class="label-text-alt font-mono text-xs">{{ settings.lineHeight.toFixed(1) }}</span>
        </label>
        <input v-model.number="settings.lineHeight" type="range" min="1.2" max="3" step="0.1" class="range range-primary range-xs" />
      </div>

      <div class="form-control">
        <label class="label">
          <span class="label-text font-medium text-sm">Letter Spacing</span>
          <span class="label-text-alt font-mono text-xs">{{ settings.letterSpacing }}px</span>
        </label>
        <input v-model.number="settings.letterSpacing" type="range" min="0" max="8" step="1" class="range range-primary range-xs" />
      </div>
    </div>

    <div class="divider"></div>

    <div class="space-y-4">
      <h3 class="text-base font-bold flex items-center gap-2">
        <IconAlignLeft class="w-4 h-4" />
        Layout
      </h3>

      <div class="form-control">
        <label class="label">
          <span class="label-text font-medium text-sm">Text Alignment</span>
        </label>
        <div class="flex gap-2">
          <button 
            @click="settings.textAlign = 'left'"
            class="btn btn-sm flex-1"
            :class="settings.textAlign === 'left' ? 'btn-primary' : 'btn-outline'"
          >
            <IconAlignLeft class="w-4 h-4" />
          </button>
          <button 
            @click="settings.textAlign = 'center'"
            class="btn btn-sm flex-1"
            :class="settings.textAlign === 'center' ? 'btn-primary' : 'btn-outline'"
          >
            <IconAlignCenter class="w-4 h-4" />
          </button>
          <button 
            @click="settings.textAlign = 'right'"
            class="btn btn-sm flex-1"
            :class="settings.textAlign === 'right' ? 'btn-primary' : 'btn-outline'"
          >
            <IconAlignRight class="w-4 h-4" />
          </button>
          <button 
            @click="settings.textAlign = 'justify'"
            class="btn btn-sm flex-1"
            :class="settings.textAlign === 'justify' ? 'btn-primary' : 'btn-outline'"
          >
            <IconAlignJustify class="w-4 h-4" />
          </button>
        </div>
      </div>

      <div class="form-control">
        <label class="label">
          <span class="label-text font-medium text-sm">Max Width</span>
        </label>
        <select v-model="settings.maxWidth" class="select select-bordered select-sm w-full">
          <option value="full">Full Width</option>
          <option value="2xl">Reading Width (42rem)</option>
          <option value="4xl">Wide (56rem)</option>
          <option value="6xl">Extra Wide (72rem)</option>
        </select>
      </div>

      <div class="form-control">
        <label class="label cursor-pointer">
          <span class="label-text font-medium text-sm">Vertical Text</span>
          <input v-model="settings.verticalText" type="checkbox" class="toggle toggle-primary toggle-sm" />
        </label>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import IconType from '~icons/lucide/type'
import IconAlignLeft from '~icons/lucide/align-left'
import IconAlignCenter from '~icons/lucide/align-center'
import IconAlignRight from '~icons/lucide/align-right'
import IconAlignJustify from '~icons/lucide/align-justify'
import IconShoppingBag from '~icons/lucide/shopping-bag'
import { type ReaderSettings } from '~/types/reader'
import { useFontStore } from '~/stores/useFontStore'

const props = defineProps<{
  settings: ReaderSettings
}>()

const fontStore = useFontStore()
const installedFonts = computed(() => fontStore.installedFonts)

const emit = defineEmits<{
  (e: 'openMarketplace'): void
}>()

function openMarketplace() {
  emit('openMarketplace')
}
</script>