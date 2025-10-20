<template>
  <div class="space-y-6">
    <div class="space-y-4">
      <h3 class="text-base font-bold flex items-center gap-2">
        <IconMessageCircle class="w-4 h-4" />
        Tooltip Settings
      </h3>

      <div class="form-control">
        <label class="label cursor-pointer">
          <span class="label-text font-medium text-sm">Show Tooltip on Hover</span>
          <input v-model="settings.showTooltip" type="checkbox" class="toggle toggle-primary toggle-sm" />
        </label>
      </div>

      <div class="space-y-4 pt-4 border-t border-base-300" :class="{ 'opacity-50 pointer-events-none': !settings.showTooltip }">
        <div class="form-control">
          <label class="label">
            <span class="label-text font-medium text-sm">Tooltip Size</span>
          </label>
          <select v-model="settings.tooltipSize" class="select select-bordered select-sm w-full">
            <option value="sm">Small</option>
            <option value="md">Medium</option>
            <option value="lg">Large</option>
          </select>
        </div>

        <div class="form-control">
          <label class="label">
            <span class="label-text font-medium text-sm">Delay: {{ settings.tooltipDelay }}ms</span>
          </label>
          <input v-model.number="settings.tooltipDelay" type="range" min="0" max="500" step="50" class="range range-primary range-xs" />
        </div>

        <div class="form-control">
          <label class="label cursor-pointer">
            <span class="label-text font-medium text-sm">Show Part of Speech</span>
            <input v-model="settings.showPartOfSpeech" type="checkbox" class="toggle toggle-primary toggle-sm" />
          </label>
        </div>

        <div class="form-control">
          <label class="label cursor-pointer">
            <span class="label-text font-medium text-sm">Show JLPT Level</span>
            <input v-model="settings.showJLPTLevel" type="checkbox" class="toggle toggle-primary toggle-sm" />
          </label>
        </div>

        <div class="form-control">
          <label class="label cursor-pointer">
            <span class="label-text font-medium text-sm">Show Pitch Accent</span>
            <input v-model="settings.showPitchAccent" type="checkbox" class="toggle toggle-primary toggle-sm" />
          </label>
        </div>

        <div class="form-control">
          <label class="label cursor-pointer">
            <span class="label-text font-medium text-sm">Show Example Sentence</span>
            <input v-model="settings.showExample" type="checkbox" class="toggle toggle-primary toggle-sm" />
          </label>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import IconMessageCircle from '~icons/lucide/message-circle'
import { type ReaderSettings } from '~/types/reader'

defineProps<{
  settings: ReaderSettings
}>()
</script>