<template>
  <div class="space-y-6">
    <h3 class="text-lg font-semibold mb-4">Display Settings</h3>

    <div class="form-control">
      <label class="label">
        <span class="label-text">Text Alignment</span>
      </label>
      <select v-model="settings.textAlign" class="select select-bordered w-full">
        <option value="left">Left</option>
        <option value="center">Center</option>
        <option value="right">Right</option>
        <option value="justify">Justify</option>
      </select>
    </div>

    <div class="form-control">
      <label class="label">
        <span class="label-text">Max Width</span>
      </label>
      <select v-model="settings.maxWidth" class="select select-bordered w-full">
        <option value="full">Full Width</option>
        <option value="2xl">2XL (672px)</option>
        <option value="4xl">4XL (896px)</option>
        <option value="6xl">6XL (1152px)</option>
      </select>
    </div>

    <div class="form-control">
      <label class="label cursor-pointer">
        <span class="label-text">Vertical Text</span>
        <input type="checkbox" v-model="settings.verticalText" class="toggle toggle-primary" />
      </label>
    </div>

    <div class="form-control">
      <label class="label cursor-pointer">
        <span class="label-text">Show Word Spacing</span>
        <input type="checkbox" v-model="settings.showWordSpacing" class="toggle toggle-primary" />
      </label>
    </div>

    <div class="form-control">
      <label class="label cursor-pointer">
        <span class="label-text">Show Sentence Numbers</span>
        <input type="checkbox" v-model="settings.showSentenceNumbers" class="toggle toggle-primary" />
      </label>
    </div>

    <div v-if="settings.showSentenceNumbers" class="form-control">
      <label class="label">
        <span class="label-text">Number Position</span>
      </label>
      <select v-model="settings.sentenceNumberPosition" class="select select-bordered w-full">
        <option value="left">Left</option>
        <option value="right">Right</option>
      </select>
    </div>

    <div class="form-control">
      <label class="label">
        <span class="label-text">Sentences Per Page: {{ settings.sentencesPerPage }}</span>
      </label>
      <input 
        type="range" 
        v-model.number="settings.sentencesPerPage" 
        min="5" 
        max="50" 
        step="5"
        class="range range-primary" 
      />
      <div class="flex justify-between text-xs px-2 mt-1">
        <span>5</span>
        <span>15</span>
        <span>25</span>
        <span>35</span>
        <span>50</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ReaderSettings } from '~/types/reader'

interface Props {
  settings: ReaderSettings
}

defineProps<Props>()
</script>