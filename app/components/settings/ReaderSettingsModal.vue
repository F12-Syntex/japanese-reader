<template>
  <BaseModal :model-value="modelValue" @update:model-value="emit('update:modelValue', $event)" title="Reader Settings" subtitle="Customize your reading experience" size="2xl">
    <template #default>
      <div class="flex flex-col gap-4 h-full overflow-hidden md:flex-row">
        <div class="hidden md:flex tabs tabs-boxed bg-base-200 flex-col w-full">
          <button 
            v-for="tab in tabs" 
            :key="tab.id"
            @click="activeTab = tab.id"
            class="tab gap-2 justify-start text-xs md:text-sm"
            :class="activeTab === tab.id ? 'tab-active' : ''"
          >
            <component :is="tab.icon" class="w-4 h-4" />
            <span>{{ tab.label }}</span>
          </button>
        </div>

        <div class="overflow-y-auto flex-1">
          <div class="space-y-6 pr-2">
            <TypographySettings v-show="activeTab === 'typography'" :settings="localSettings" />
            <MarketplaceSettings 
              v-show="activeTab === 'marketplace'" 
              :settings="localSettings"
            />
            <FuriganaSettings v-show="activeTab === 'furigana'" :settings="localSettings" />
            <TooltipSettings v-show="activeTab === 'tooltip'" :settings="localSettings" />
            <HighlightingSettings v-show="activeTab === 'highlighting'" :settings="localSettings" />
            <DisplaySettings v-show="activeTab === 'display'" :settings="localSettings" />
            <InteractionSettings v-show="activeTab === 'interaction'" :settings="localSettings" @reset="handleReset" />
          </div>
        </div>
      </div>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import IconType from '~icons/lucide/type'
import IconShoppingBag from '~icons/lucide/shopping-bag'
import IconRuler from '~icons/lucide/ruler'
import IconMessageCircle from '~icons/lucide/message-circle'
import IconPalette from '~icons/lucide/palette'
import IconEye from '~icons/lucide/eye'
import IconMousePointer from '~icons/lucide/mouse-pointer'
import { useReaderSettingsStore } from '~/stores/useReaderSettingsStore'
import { defaultReaderSettings, type ReaderSettings } from '~/types/reader'

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

interface Props {
  modelValue: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const activeTab = ref<string>('typography')
const readerStore = useReaderSettingsStore()
const localSettings = ref<ReaderSettings>({ ...defaultReaderSettings })

const tabs: TabItem[] = [
  { id: 'typography', label: 'Typography', icon: IconType },
  { id: 'marketplace', label: 'Marketplace', icon: IconShoppingBag },
  { id: 'furigana', label: 'Furigana', icon: IconRuler },
  { id: 'tooltip', label: 'Tooltip', icon: IconMessageCircle },
  { id: 'highlighting', label: 'Highlighting', icon: IconPalette },
  { id: 'display', label: 'Display', icon: IconEye },
  { id: 'interaction', label: 'Interaction', icon: IconMousePointer }
]

const handleReset = (): void => {
  localSettings.value = { ...defaultReaderSettings }
  readerStore.settings = { ...defaultReaderSettings }
  emit('update:modelValue', false)
}

watch(() => props.modelValue, (newVal: boolean) => {
  if (newVal) {
    localSettings.value = { ...readerStore.settings }
    activeTab.value = 'typography'
  }
})

watch(localSettings, (newSettings: ReaderSettings) => {
  readerStore.settings = { ...newSettings }
}, { deep: true })
</script>