<template>
  <div class="space-y-6">
    <div class="space-y-4">
      <h3 class="text-base font-bold flex items-center gap-2">
        <IconEye class="w-4 h-4" />
        Display Options
      </h3>

      <div class="form-control">
        <label class="label cursor-pointer">
          <span class="label-text font-medium text-sm">Show Word Spacing</span>
          <input v-model="settings.showWordSpacing" type="checkbox" class="toggle toggle-primary toggle-sm" />
        </label>
      </div>

      <div class="form-control">
        <label class="label cursor-pointer">
          <span class="label-text font-medium text-sm">Always Show Translation</span>
          <input v-model="settings.alwaysShowTranslation" type="checkbox" class="toggle toggle-primary toggle-sm" />
        </label>
      </div>

      <div class="space-y-4 pt-4 border-t border-base-300" :class="{ 'opacity-50 pointer-events-none': !settings.alwaysShowTranslation }">
        <div class="form-control">
          <label class="label">
            <span class="label-text font-medium text-sm">Translation Size: {{ settings.translationSize }}px</span>
          </label>
          <input v-model.number="settings.translationSize" type="range" min="8" max="16" class="range range-primary range-xs" />
        </div>

        <div class="form-control">
          <label class="label">
            <span class="label-text font-medium text-sm">Translation Gap: {{ settings.translationGap }}px</span>
          </label>
          <input v-model.number="settings.translationGap" type="range" min="2" max="10" class="range range-primary range-xs" />
        </div>
      </div>

      <div class="form-control">
        <label class="label cursor-pointer">
          <span class="label-text font-medium text-sm">Show Sentence Numbers</span>
          <input v-model="settings.showSentenceNumbers" type="checkbox" class="toggle toggle-primary toggle-sm" />
        </label>
      </div>

      <div class="form-control" :class="{ 'opacity-50 pointer-events-none': !settings.showSentenceNumbers }">
        <label class="label">
          <span class="label-text font-medium text-sm">Number Position</span>
        </label>
        <select v-model="settings.sentenceNumberPosition" class="select select-bordered select-sm w-full">
          <option value="left">Left</option>
          <option value="right">Right</option>
        </select>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import IconEye from '~icons/lucide/eye'
import { type ReaderSettings } from '~/types/reader'

defineProps<{
  settings: ReaderSettings
}>()
</script>