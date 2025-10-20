<template>
  <BaseModal :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)" title="Reader Settings" subtitle="Customize your reading experience" size="lg">
    <template #default>
      <div class="flex h-full min-h-0">
        <div class="w-40 sm:w-48 border-r border-base-300 flex-shrink-0 overflow-y-auto custom-scrollbar">
          <div class="p-2 sm:p-3 space-y-1">
            <button 
              v-for="tab in tabs" 
              :key="tab.id"
              @click="activeTab = tab.id"
              class="btn btn-ghost btn-xs sm:btn-sm w-full justify-start gap-2 text-left"
              :class="{ 'btn-active': activeTab === tab.id }"
            >
              <component :is="tab.icon" class="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
              <span class="text-xs sm:text-sm truncate">{{ tab.label }}</span>
            </button>
          </div>
        </div>

        <div class="flex-1 overflow-y-auto custom-scrollbar min-h-0">
          <div class="p-4 sm:p-6 space-y-6">
            <TypographySettings v-if="activeTab === 'typography'" :settings="localSettings" />
            <MarketplaceSettings 
              v-else-if="activeTab === 'marketplace'" 
              :settings="localSettings" 
              @back="activeTab = 'typography'"
            />
            <FuriganaSettings v-else-if="activeTab === 'furigana'" :settings="localSettings" />
            <TooltipSettings v-else-if="activeTab === 'tooltip'" :settings="localSettings" />
            <HighlightingSettings v-else-if="activeTab === 'highlighting'" :settings="localSettings" />
            <DisplaySettings v-else-if="activeTab === 'display'" :settings="localSettings" />
            <InteractionSettings v-else-if="activeTab === 'interaction'" :settings="localSettings" @reset="resetToDefaults" />
          </div>
        </div>
      </div>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import IconType from '~icons/lucide/type'
import IconShoppingBag from '~icons/lucide/shopping-bag'
import IconMessageCircle from '~icons/lucide/message-circle'
import IconPalette from '~icons/lucide/palette'
import IconEye from '~icons/lucide/eye'
import IconMousePointer from '~icons/lucide/mouse-pointer'
import { defaultReaderSettings, type ReaderSettings } from '~/types/reader'
import { useReaderSettingsStore } from '~/stores/useReaderSettingsStore'

// Import all sub-component modules
import TypographySettings from './TypographySettings.vue'
import MarketplaceSettings from './MarketplaceSettings.vue'
import FuriganaSettings from './FuriganaSettings.vue'
import TooltipSettings from './TooltipSettings.vue'
import HighlightingSettings from './HighlightingSettings.vue'
import DisplaySettings from './DisplaySettings.vue'
import InteractionSettings from './InteractionSettings.vue'

interface TabItem {
  id: string
  label: string
  icon: any
}

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const activeTab = ref<string>('typography')
const localSettings = ref<ReaderSettings>({ ...defaultReaderSettings })
const readerStore = useReaderSettingsStore()

const tabs: TabItem[] = [
  { id: 'typography', label: 'Typography', icon: IconType },
  { id: 'marketplace', label: 'Marketplace', icon: IconShoppingBag },
  { id: 'furigana', label: 'Furigana', icon: IconType },
  { id: 'tooltip', label: 'Tooltip', icon: IconMessageCircle },
  { id: 'highlighting', label: 'Highlighting', icon: IconPalette },
  { id: 'display', label: 'Display', icon: IconEye },
  { id: 'interaction', label: 'Interaction', icon: IconMousePointer }
]

const resetToDefaults = (): void => {
  localSettings.value = { ...defaultReaderSettings }
  emit('update:modelValue', false)
}

watch(() => props.modelValue, (newVal: boolean) => {
  if (newVal) {
    localSettings.value = { ...readerStore.settings }
    activeTab.value = 'typography'
  }
}, { immediate: true })

watch(localSettings, (newSettings: ReaderSettings) => {
  readerStore.settings = { ...newSettings }
}, { deep: true })
</script>