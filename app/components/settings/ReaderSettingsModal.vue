<template>
  <BaseModal :model-value="modelValue" @update:model-value="emit('update:modelValue', $event)" title="Settings" subtitle="Customize your experience" size="4xl" fixed-height="85vh">
    <template #default>
      <div class="flex flex-col md:flex-row h-full gap-4 md:gap-6">
        <div class="md:hidden bg-base-100 border-b border-base-300 pb-2 -mt-4 -mx-4 px-4 mb-2">
          <div class="flex justify-around items-center p-2 w-full max-w-full overflow-x-hidden">
            <button 
              v-for="tab in tabs" 
              :key="tab.id"
              @click="activeTab = tab.id"
              :title="tab.label"
              class="p-3 rounded-lg transition-colors flex-shrink-0"
              :class="activeTab === tab.id ? 'bg-primary text-primary-content' : 'text-base-content hover:bg-base-200'"
            >
              <component :is="tab.icon" class="w-5 h-5" />
            </button>
          </div>
        </div>

        <div class="hidden md:flex md:flex-col md:w-48 lg:w-56 flex-shrink-0 gap-2 overflow-y-auto pr-2 ">
          <button 
            v-for="tab in tabs" 
            :key="tab.id"
            @click="activeTab = tab.id"
            class="btn justify-start gap-3 w-full flex-shrink-0"
            :class="activeTab === tab.id ? 'btn-primary' : 'btn-ghost'"
          >
            <component :is="tab.icon" class="w-5 h-5" />
            <span class="text-sm">{{ tab.label }}</span>
          </button>
        </div>

        <div class="flex-1 overflow-x-hidden overflow-y-auto pr-2 min-h-0">
          <AccountSettings v-show="activeTab === 'account'" @open-anki-data="activeTab = 'ankidata'" />
          <TypographySettings v-show="activeTab === 'typography'" :settings="readerStore.settings" @open-marketplace="activeTab = 'marketplace'" />
          <MarketplaceSettings 
            v-show="activeTab === 'marketplace'" 
            :settings="readerStore.settings"
            @back="activeTab = 'typography'"
          />
          <FuriganaSettings v-show="activeTab === 'furigana'" :settings="readerStore.settings" />
          <TooltipSettings v-show="activeTab === 'tooltip'" :settings="readerStore.settings" />
          <HighlightingSettings v-show="activeTab === 'highlighting'" :settings="readerStore.settings" />
          <DisplaySettings v-show="activeTab === 'display'" :settings="readerStore.settings" />
          <InteractionSettings v-show="activeTab === 'interaction'" :settings="readerStore.settings" @reset="handleReset" />
          <ClientOnly>
            <StorageSettings v-show="activeTab === 'storage'" />
            <AnkiDataSettings v-show="activeTab === 'ankidata'" @back="activeTab = 'account'" />
          </ClientOnly>
        </div>
      </div>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import IconUser from '~icons/lucide/user'
import IconType from '~icons/lucide/type'
import IconRuler from '~icons/lucide/ruler'
import IconMessageCircle from '~icons/lucide/message-circle'
import IconPalette from '~icons/lucide/palette'
import IconEye from '~icons/lucide/eye'
import IconMousePointer from '~icons/lucide/mouse-pointer'
import IconDatabase from '~icons/lucide/database'
import { useReaderSettingsStore } from '~/stores/useReaderSettingsStore'

import AccountSettings from './AccountSettings.vue'
import TypographySettings from './TypographySettings.vue'
import MarketplaceSettings from './MarketplaceSettings.vue'
import FuriganaSettings from './FuriganaSettings.vue'
import TooltipSettings from './TooltipSettings.vue'
import HighlightingSettings from './HighlightingSettings.vue'
import DisplaySettings from './DisplaySettings.vue'
import InteractionSettings from './InteractionSettings.vue'
import StorageSettings from './StorageSettings.vue'
import AnkiDataSettings from './AnkiDataSettings.vue'

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

const activeTab = ref<string>('account')
const readerStore = useReaderSettingsStore()

const tabs: TabItem[] = [
  { id: 'account', label: 'Account', icon: IconUser },
  { id: 'typography', label: 'Typography', icon: IconType },
  { id: 'furigana', label: 'Furigana', icon: IconRuler },
  { id: 'tooltip', label: 'Tooltip', icon: IconMessageCircle },
  { id: 'highlighting', label: 'Highlighting', icon: IconPalette },
  { id: 'display', label: 'Display', icon: IconEye },
  { id: 'interaction', label: 'Interaction', icon: IconMousePointer },
  { id: 'storage', label: 'Storage', icon: IconDatabase }
]

const handleReset = (): void => {
  readerStore.reset()
  emit('update:modelValue', false)
}

watch(() => props.modelValue, (newVal: boolean) => {
  if (newVal) {
    activeTab.value = 'account'
  }
})
</script>