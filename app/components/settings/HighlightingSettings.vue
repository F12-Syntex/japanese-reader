<template>
  <div class="space-y-6">
    <div class="space-y-4">
      <h3 class="text-base font-bold flex items-center gap-2">
        <IconPalette class="w-4 h-4" />
        Word Highlighting
      </h3>

      <div class="space-y-3">
        <div class="form-control">
          <label class="label cursor-pointer">
            <span class="label-text font-medium text-sm">Highlight Particles</span>
            <input v-model="settings.highlightParticles" type="checkbox" class="toggle toggle-primary toggle-sm" />
          </label>
        </div>

        <div class="form-control">
          <label class="label cursor-pointer">
            <span class="label-text font-medium text-sm">Highlight Verbs</span>
            <input v-model="settings.highlightVerbs" type="checkbox" class="toggle toggle-primary toggle-sm" />
          </label>
        </div>

        <div class="form-control">
          <label class="label cursor-pointer">
            <span class="label-text font-medium text-sm">Highlight Adjectives</span>
            <input v-model="settings.highlightAdjectives" type="checkbox" class="toggle toggle-primary toggle-sm" />
          </label>
        </div>

        <div class="form-control">
          <label class="label cursor-pointer">
            <span class="label-text font-medium text-sm">Highlight Nouns</span>
            <input v-model="settings.highlightNouns" type="checkbox" class="toggle toggle-primary toggle-sm" />
          </label>
        </div>
      </div>
    </div>

    <div class="divider"></div>

    <div class="space-y-4">
      <h3 class="text-base font-bold flex items-center gap-2">
        <IconBookmark class="w-4 h-4" />
        Known Words
      </h3>

      <div class="form-control">
        <label class="label cursor-pointer">
          <span class="label-text font-medium text-sm">Highlight Known Words</span>
          <input v-model="settings.highlightKnownWords" type="checkbox" class="toggle toggle-primary toggle-sm" />
        </label>
      </div>

      <div class="space-y-4 pt-4 border-t border-base-300" :class="{ 'opacity-50 pointer-events-none': !settings.highlightKnownWords }">
        <div class="form-control">
          <label class="label">
            <span class="label-text font-medium text-sm">Opacity: {{ settings.knownWordOpacity }}%</span>
          </label>
          <input v-model.number="settings.knownWordOpacity" type="range" min="10" max="100" class="range range-primary range-xs" />
        </div>

        <div class="form-control">
          <label class="label cursor-pointer">
            <span class="label-text font-medium text-sm">Dim Known Words</span>
            <input v-model="settings.dimKnownWords" type="checkbox" class="toggle toggle-primary toggle-sm" />
          </label>
        </div>

        <div class="form-control">
          <label class="label cursor-pointer">
            <span class="label-text font-medium text-sm">Strikethrough Known</span>
            <input v-model="settings.strikethroughKnown" type="checkbox" class="toggle toggle-primary toggle-sm" />
          </label>
        </div>

        <div class="form-control">
          <label class="label cursor-pointer">
            <span class="label-text font-medium text-sm">Underline Unknown</span>
            <input v-model="settings.underlineUnknown" type="checkbox" class="toggle toggle-primary toggle-sm" />
          </label>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import IconPalette from '~icons/lucide/palette'
import IconBookmark from '~icons/lucide/bookmark'
import { type ReaderSettings } from '~/types/reader'

defineProps<{
  settings: ReaderSettings
}>()
</script>