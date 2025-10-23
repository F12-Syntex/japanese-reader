<template>
  <div class="space-y-6 px-2 md:px-0">
    <div class="card bg-base-200/50 border border-base-300">
      <div class="card-body p-4 md:p-6">
        <h3 class="text-base font-bold flex items-center gap-2 mb-4">
          <IconType class="w-5 h-5" />
          Furigana Display
        </h3>

        <div class="space-y-4">
          <div class="form-control">
            <label class="label cursor-pointer">
              <span class="label-text font-medium text-sm">Show Furigana</span>
              <input v-model="settings.showFurigana" type="checkbox" class="checkbox checkbox-secondary checkbox-sm" />
            </label>
          </div>

          <div class="divider my-2"></div>

          <div class="space-y-4" :class="{ 'opacity-50 pointer-events-none': !settings.showFurigana }">
            <div class="form-control">
              <div class="flex justify-between items-center mb-2">
                <label class="label-text font-medium text-sm">Size</label>
                <span class="badge badge-secondary badge-sm">{{ (settings.furiganaSize * 100).toFixed(0) }}%</span>
              </div>
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
                <input v-model="settings.centeredFurigana" type="checkbox" class="checkbox checkbox-secondary checkbox-sm" />
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="card bg-base-200/50 border border-base-300">
      <div class="card-body p-4 md:p-6">
        <h3 class="text-base font-bold flex items-center gap-2 mb-4">
          <IconLanguages class="w-5 h-5" />
          Translation Display
        </h3>

        <div class="space-y-4">
          <div class="form-control">
            <label class="label cursor-pointer">
              <span class="label-text font-medium text-sm">Always Show Translation</span>
              <input v-model="settings.alwaysShowTranslation" type="checkbox" class="checkbox checkbox-secondary checkbox-sm" />
            </label>
          </div>

          <div class="divider my-2"></div>

          <div class="space-y-4" :class="{ 'opacity-50 pointer-events-none': !settings.alwaysShowTranslation }">
            <div class="form-control">
              <div class="flex justify-between items-center mb-2">
                <label class="label-text font-medium text-sm">Translation Size</label>
                <span class="badge badge-secondary badge-sm">{{ settings.translationSize }}px</span>
              </div>
              <input v-model.number="settings.translationSize" type="range" min="8" max="20" step="1" class="range range-secondary range-xs" />
            </div>

            <div class="form-control">
              <div class="flex justify-between items-center mb-2">
                <label class="label-text font-medium text-sm">Translation Gap</label>
                <span class="badge badge-secondary badge-sm">{{ settings.translationGap }}px</span>
              </div>
              <input v-model.number="settings.translationGap" type="range" min="0" max="16" step="1" class="range range-secondary range-xs" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import IconType from '~icons/lucide/type'
import IconLanguages from '~icons/lucide/languages'
import { type ReaderSettings } from '~/types/reader'

defineProps<{
  settings: ReaderSettings
}>()
</script>