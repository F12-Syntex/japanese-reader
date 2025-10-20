<template>
  <div class="space-y-6">
    <div class="space-y-4">
      <h3 class="text-base font-bold flex items-center gap-2">
        <IconType class="w-4 h-4" />
        Furigana Display
      </h3>

      <div class="form-control">
        <label class="label cursor-pointer">
          <span class="label-text font-medium text-sm">Show Furigana</span>
          <input v-model="settings.showFurigana" type="checkbox" class="toggle toggle-secondary toggle-sm" />
        </label>
      </div>

      <div class="space-y-4 pt-4 border-t border-base-300" :class="{ 'opacity-50 pointer-events-none': !settings.showFurigana }">
        <div class="form-control">
          <label class="label">
            <span class="label-text font-medium text-sm">Size: {{ (settings.furiganaSize * 100).toFixed(0) }}%</span>
          </label>
          <input v-model.number="settings.furiganaSize" type="range" min="0.3" max="0.8" step="0.05" class="range range-secondary range-xs" />
        </div>

        <div class="form-control">
          <label class="label">
            <span class="label-text font-medium text-sm">Position</span>
          </label>
          <select v-model="settings.furiganaPosition" class="select select-bordered select-sm w-full">
            <option value="above">Above</option>
            <option value="inline">Inline</option>
          </select>
        </div>

        <div class="form-control">
          <label class="label cursor-pointer">
            <span class="label-text font-medium text-sm">Centered</span>
            <input v-model="settings.centeredFurigana" type="checkbox" class="toggle toggle-secondary toggle-sm" />
          </label>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import IconType from '~icons/lucide/type'
import { type ReaderSettings } from '~/types/reader'

defineProps<{
  settings: ReaderSettings
}>()
</script>