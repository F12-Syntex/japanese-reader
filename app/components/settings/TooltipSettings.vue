<template>
  <div class="space-y-6 px-2 md:px-0">
    <div class="card bg-base-200/50 border border-base-300">
      <div class="card-body p-4 md:p-6">
        <h3 class="text-base font-bold flex items-center gap-2 mb-4">
          <IconMessageCircle class="w-5 h-5" />
          Tooltip Settings
        </h3>

        <div class="space-y-4">
          <div class="form-control">
            <label class="label cursor-pointer">
              <span class="label-text font-medium text-sm">Show Tooltip on Hover</span>
              <input v-model="settings.showTooltip" type="checkbox" class="checkbox checkbox-primary checkbox-sm" />
            </label>
          </div>

          <div class="divider my-2"></div>

          <div class="space-y-4" :class="{ 'opacity-50 pointer-events-none': !settings.showTooltip }">
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
              <div class="flex justify-between items-center mb-2">
                <label class="label-text font-medium text-sm">Delay</label>
                <span class="badge badge-primary badge-sm">{{ settings.tooltipDelay }}ms</span>
              </div>
              <input v-model.number="settings.tooltipDelay" type="range" min="0" max="500" step="50" class="range range-primary range-xs" />
            </div>

            <div class="form-control">
              <label class="label cursor-pointer">
                <span class="label-text font-medium text-sm">Show Part of Speech</span>
                <input v-model="settings.showPartOfSpeech" type="checkbox" class="checkbox checkbox-primary checkbox-sm" />
              </label>
            </div>

            <div class="form-control">
              <label class="label cursor-pointer">
                <span class="label-text font-medium text-sm">Show JLPT Level</span>
                <input v-model="settings.showJLPTLevel" type="checkbox" class="checkbox checkbox-primary checkbox-sm" />
              </label>
            </div>

            <div class="form-control">
              <label class="label cursor-pointer">
                <span class="label-text font-medium text-sm">Show Pitch Accent</span>
                <input v-model="settings.showPitchAccent" type="checkbox" class="checkbox checkbox-primary checkbox-sm" />
              </label>
            </div>

            <div class="form-control">
              <label class="label cursor-pointer">
                <span class="label-text font-medium text-sm">Show Example Sentence</span>
                <input v-model="settings.showExample" type="checkbox" class="checkbox checkbox-primary checkbox-sm" />
              </label>
            </div>
          </div>
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