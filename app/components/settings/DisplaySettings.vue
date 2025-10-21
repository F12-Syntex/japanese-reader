<template>
  <div class="space-y-6 px-2 md:px-0">
    <div class="card bg-base-200/50 border border-base-300">
      <div class="card-body p-4 md:p-6">
        <h3 class="text-base font-bold flex items-center gap-2 mb-4">
          <IconEye class="w-5 h-5" />
          Display Options
        </h3>

        <div class="space-y-4">
          <div class="form-control">
            <label class="label cursor-pointer">
              <span class="label-text font-medium text-sm">Show Word Spacing</span>
              <input v-model="settings.showWordSpacing" type="checkbox" class="checkbox checkbox-primary checkbox-sm" />
            </label>
          </div>

          <div class="form-control">
            <label class="label cursor-pointer">
              <span class="label-text font-medium text-sm">Always Show Translation</span>
              <input v-model="settings.alwaysShowTranslation" type="checkbox" class="checkbox checkbox-primary checkbox-sm" />
            </label>
          </div>

          <div class="divider my-2"></div>

          <div class="space-y-4" :class="{ 'opacity-50 pointer-events-none': !settings.alwaysShowTranslation }">
            <div class="form-control">
              <div class="flex justify-between items-center mb-2">
                <label class="label-text font-medium text-sm">Translation Size</label>
                <span class="badge badge-primary badge-sm">{{ settings.translationSize }}px</span>
              </div>
              <input v-model.number="settings.translationSize" type="range" min="8" max="16" class="range range-primary range-xs" />
            </div>

            <div class="form-control">
              <div class="flex justify-between items-center mb-2">
                <label class="label-text font-medium text-sm">Translation Gap</label>
                <span class="badge badge-primary badge-sm">{{ settings.translationGap }}px</span>
              </div>
              <input v-model.number="settings.translationGap" type="range" min="2" max="10" class="range range-primary range-xs" />
            </div>
          </div>

          <div class="divider my-2"></div>

          <div class="form-control">
            <label class="label cursor-pointer">
              <span class="label-text font-medium text-sm">Show Sentence Numbers</span>
              <input v-model="settings.showSentenceNumbers" type="checkbox" class="checkbox checkbox-primary checkbox-sm" />
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