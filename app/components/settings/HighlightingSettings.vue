<template>
  <div class="space-y-6 px-2 md:px-0">
    <div class="card bg-base-200/50 border border-base-300">
      <div class="card-body p-4 md:p-6">
        <h3 class="text-base font-bold flex items-center gap-2 mb-4">
          <IconPalette class="w-5 h-5" />
          Word Highlighting
        </h3>

        <div class="space-y-3">
          <div class="form-control">
            <label class="label cursor-pointer">
              <span class="label-text font-medium text-sm">Highlight Particles</span>
              <input v-model="settings.highlightParticles" type="checkbox" class="checkbox checkbox-primary checkbox-sm" />
            </label>
          </div>

          <div class="form-control">
            <label class="label cursor-pointer">
              <span class="label-text font-medium text-sm">Highlight Verbs</span>
              <input v-model="settings.highlightVerbs" type="checkbox" class="checkbox checkbox-primary checkbox-sm" />
            </label>
          </div>

          <div class="form-control">
            <label class="label cursor-pointer">
              <span class="label-text font-medium text-sm">Highlight Adjectives</span>
              <input v-model="settings.highlightAdjectives" type="checkbox" class="checkbox checkbox-primary checkbox-sm" />
            </label>
          </div>

          <div class="form-control">
            <label class="label cursor-pointer">
              <span class="label-text font-medium text-sm">Highlight Nouns</span>
              <input v-model="settings.highlightNouns" type="checkbox" class="checkbox checkbox-primary checkbox-sm" />
            </label>
          </div>

          <div class="form-control">
            <label class="label cursor-pointer">
              <span class="label-text font-medium text-sm">Highlight Grammar Points</span>
              <input v-model="settings.highlightGrammar" type="checkbox" class="checkbox checkbox-primary checkbox-sm" />
            </label>
          </div>

          <div class="form-control">
            <label class="label cursor-pointer">
              <span class="label-text font-medium text-sm">Highlight Known Words</span>
              <input v-model="settings.highlightKnownWords" type="checkbox" class="checkbox checkbox-primary checkbox-sm" />
            </label>
          </div>
        </div>
      </div>
    </div>

    <div class="card bg-base-200/50 border border-base-300">
      <div class="card-body p-4 md:p-6">
        <h3 class="text-base font-bold flex items-center gap-2 mb-4">
          <IconBookmark class="w-5 h-5" />
          Known Words Options
        </h3>

        <div class="space-y-4" :class="{ 'opacity-50 pointer-events-none': !settings.highlightKnownWords }">
          <div class="form-control">
            <div class="flex justify-between items-center mb-2">
              <label class="label-text font-medium text-sm">Opacity</label>
              <span class="badge badge-primary badge-sm">{{ settings.knownWordOpacity }}%</span>
            </div>
            <input v-model.number="settings.knownWordOpacity" type="range" min="10" max="100" class="range range-primary range-xs" />
          </div>

          <div class="form-control">
            <label class="label cursor-pointer">
              <span class="label-text font-medium text-sm">Dim Known Words</span>
              <input v-model="settings.dimKnownWords" type="checkbox" class="checkbox checkbox-primary checkbox-sm" />
            </label>
          </div>

          <div class="form-control">
            <label class="label cursor-pointer">
              <span class="label-text font-medium text-sm">Strikethrough Known</span>
              <input v-model="settings.strikethroughKnown" type="checkbox" class="checkbox checkbox-primary checkbox-sm" />
            </label>
          </div>

          <div class="form-control">
            <label class="label cursor-pointer">
              <span class="label-text font-medium text-sm">Underline Unknown</span>
              <input v-model="settings.underlineUnknown" type="checkbox" class="checkbox checkbox-primary checkbox-sm" />
            </label>
          </div>
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