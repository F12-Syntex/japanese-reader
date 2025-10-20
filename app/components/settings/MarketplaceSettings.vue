<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between mb-4">
      <div>
        <h3 class="text-base font-bold">Font Marketplace</h3>
        <p class="text-xs text-base-content/60 mt-1">Download and manage Japanese fonts</p>
      </div>
      <button @click="$emit('back')" class="btn btn-ghost btn-sm gap-2">
        <IconArrowLeft class="w-4 h-4" />
        Back
      </button>
    </div>

    <div class="form-control">
      <input
        v-model="marketplaceSearch"
        type="text"
        placeholder="Search fonts..."
        class="input input-bordered input-sm w-full"
      />
    </div>

    <div class="tabs tabs-boxed">
      <a class="tab tab-sm" :class="{ 'tab-active': marketplaceTab === 'available' }" @click="marketplaceTab = 'available'">
        Available ({{ filteredDownloadableFonts.length }})
      </a>
      <a class="tab tab-sm" :class="{ 'tab-active': marketplaceTab === 'installed' }" @click="marketplaceTab = 'installed'">
        Installed ({{ installedFonts.length }})
      </a>
      <a class="tab tab-sm" :class="{ 'tab-active': marketplaceTab === 'custom' }" @click="marketplaceTab = 'custom'">
        Custom
      </a>
    </div>

    <div v-if="marketplaceTab === 'available'" class="space-y-3">
      <div v-if="downloadableFonts.length === 0" class="flex flex-col items-center justify-center py-12 text-center">
        <span class="loading loading-spinner loading-lg text-primary mb-4"></span>
        <p class="text-sm text-base-content/60">Loading fonts from Google Fonts...</p>
      </div>

      <div v-else-if="filteredDownloadableFonts.length === 0" class="flex flex-col items-center justify-center py-12 text-center">
        <IconSearch class="w-12 h-12 text-base-content/20 mb-4" />
        <p class="text-sm text-base-content/60">No fonts found matching "{{ marketplaceSearch }}"</p>
      </div>

      <div v-else class="grid grid-cols-1 gap-3">
        <div 
          v-for="font in filteredDownloadableFonts" 
          :key="font.value"
          class="card bg-base-200 border border-base-300 hover:border-primary transition-colors"
        >
          <div class="card-body p-4">
            <div class="flex items-start justify-between gap-3">
              <div class="flex-1 min-w-0">
                <h4 class="font-bold text-sm mb-2">{{ font.name }}</h4>
                <div 
                  class="text-lg mb-3 p-3 bg-base-100 rounded border border-base-300 whitespace-nowrap overflow-hidden text-ellipsis"
                  :style="{ fontFamily: font.value }"
                >
                  こんにちは、世界！ 日本語のフォントテストです。
                </div>
              </div>
              <button
                @click="installFont(font)"
                :disabled="isLoadingFont === font.value"
                class="btn btn-primary btn-sm gap-2 flex-shrink-0"
              >
                <span v-if="isLoadingFont === font.value" class="loading loading-spinner loading-xs"></span>
                <IconDownload v-else class="w-4 h-4" />
                {{ isLoadingFont === font.value ? 'Loading...' : 'Download' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="marketplaceTab === 'installed'" class="space-y-3">
      <div v-if="installedFonts.length === 0" class="flex flex-col items-center justify-center py-12 text-center">
        <IconPackage class="w-12 h-12 text-base-content/20 mb-4" />
        <p class="text-sm text-base-content/60">No fonts installed yet</p>
        <button @click="marketplaceTab = 'available'" class="btn btn-primary btn-sm mt-4">
          Browse Available Fonts
        </button>
      </div>

      <div v-else class="grid grid-cols-1 gap-3">
        <div 
          v-for="font in installedFonts" 
          :key="font.value"
          class="card bg-base-200 border border-base-300"
        >
          <div class="card-body p-4">
            <div class="flex items-start justify-between gap-3">
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-2">
                  <h4 class="font-bold text-sm">{{ font.name }}</h4>
                  <span v-if="settings.fontFamily === font.value" class="badge badge-primary badge-xs">Active</span>
                </div>
                <div 
                  class="text-lg mb-3 p-3 bg-base-100 rounded border border-base-300 whitespace-nowrap overflow-hidden text-ellipsis"
                  :style="{ fontFamily: font.value }"
                >
                  こんにちは、世界！ 日本語のフォントテストです。
                </div>
              </div>
              <div class="flex flex-col gap-2 flex-shrink-0">
                <button
                  @click="selectFont(font)"
                  class="btn btn-sm gap-2"
                  :class="settings.fontFamily === font.value ? 'btn-success' : 'btn-ghost'"
                >
                  <IconCheck class="w-4 h-4" />
                  {{ settings.fontFamily === font.value ? 'Active' : 'Use' }}
                </button>
                <button
                  v-if="font.value !== systemFont"
                  @click="removeFont(font.value)"
                  class="btn btn-error btn-outline btn-sm gap-2"
                >
                  <IconTrash class="w-4 h-4" />
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="marketplaceTab === 'custom'" class="space-y-4">
      <div class="alert alert-info text-xs">
        <IconInfo class="w-4 h-4" />
        <span>
          To add a custom font:<br>
          1. Go to <a href="https://fonts.google.com" target="_blank" class="link link-primary">fonts.google.com</a>.<br>
          2. Search for a Japanese font.<br>
          3. Select the font and styles (e.g., weights 300-700).<br>
          4. In the right panel, copy the &lt;link&gt; href URL (e.g., https://fonts.googleapis.com/css2?family=Hachi+Maru+Pop&display=swap).<br>
          5. Paste it below and click Add.
        </span>
      </div>

      <div class="form-control">
        <label class="label">
          <span class="label-text font-medium text-sm">Custom Font URL</span>
        </label>
        <div class="join">
          <input
            v-model="customUrl"
            type="text"
            placeholder="Paste Google Fonts URL here"
            class="input input-bordered input-sm w-full join-item"
          />
          <button
            @click="addCustomFont"
            :disabled="!customUrl || isLoadingCustom"
            class="btn btn-primary btn-sm join-item"
          >
            <span v-if="isLoadingCustom" class="loading loading-spinner loading-xs"></span>
            Add
          </button>
        </div>
      </div>

      <div v-if="customError" class="alert alert-error text-xs">
        {{ customError }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import IconArrowLeft from '~icons/lucide/arrow-left'
import IconSearch from '~icons/lucide/search'
import IconPackage from '~icons/lucide/package'
import IconDownload from '~icons/lucide/download'
import IconCheck from '~icons/lucide/check'
import IconTrash from '~icons/lucide/trash2'
import IconInfo from '~icons/lucide/info'
import { type ReaderSettings } from '~/types/reader'
import { useFontStore } from '~/stores/useFontStore'

const props = defineProps<{
  settings: ReaderSettings
}>()

const emit = defineEmits<{
  back: []
}>()

const marketplaceTab = ref<'available' | 'installed' | 'custom'>('available')
const marketplaceSearch = ref('')
const customUrl = ref('')
const isLoadingCustom = ref(false)
const customError = ref('')

const fontStore = useFontStore()
const systemFont = 'Noto Sans JP'

const installedFonts = computed(() => fontStore.installedFonts)
const downloadableFonts = computed(() => fontStore.downloadableFonts)
const isLoadingFont = computed(() => fontStore.loading)

const filteredDownloadableFonts = computed(() => 
  downloadableFonts.value.filter(font => 
    font.name.toLowerCase().includes(marketplaceSearch.value.toLowerCase())
  )
)

const installFont = async (font: any) => {
  await fontStore.installFont(font)
}

const selectFont = (font: any) => {
  props.settings.fontFamily = font.value
}

const removeFont = (fontValue: string) => {
  fontStore.removeFont(fontValue)
}

const addCustomFont = async () => {
  if (customUrl.value) {
    await fontStore.addCustomFont(customUrl.value)
    if (!customError.value) {
      customUrl.value = ''
    }
  }
}
</script>