<template>
  <BaseModal :model-value="modelValue" @update:model-value="emit('update:modelValue', $event)" title="Settings" subtitle="Customize your experience" size="2xl">
    <template #default>
      <div class="flex flex-col gap-4 h-full overflow-hidden">
        <div class="hidden md:flex tabs tabs-boxed bg-base-200 flex-shrink-0">
          <button 
            v-for="tab in tabs" 
            :key="tab.id"
            @click="activeTab = tab.id"
            class="tab flex items-center gap-2 text-xs md:text-sm"
            :class="activeTab === tab.id ? 'tab-active' : ''"
          >
            <component :is="tab.icon" class="w-4 h-4" />
            <span class="hidden lg:inline">{{ tab.label }}</span>
          </button>
        </div>

        <div class="overflow-y-auto flex-1 pr-2">
          <div class="space-y-6">
            <AccountSettings v-show="activeTab === 'account'" />
            <TypographySettings v-show="activeTab === 'typography'" :settings="readerStore.settings" />
            <MarketplaceSettings 
              v-show="activeTab === 'marketplace'" 
              :settings="readerStore.settings"
            />
            <FuriganaSettings v-show="activeTab === 'furigana'" :settings="readerStore.settings" />
            <TooltipSettings v-show="activeTab === 'tooltip'" :settings="readerStore.settings" />
            <HighlightingSettings v-show="activeTab === 'highlighting'" :settings="readerStore.settings" />
            <DisplaySettings v-show="activeTab === 'display'" :settings="readerStore.settings" />
            <InteractionSettings v-show="activeTab === 'interaction'" :settings="readerStore.settings" @reset="handleReset" />
          </div>
        </div>

        <div class="md:hidden fixed bottom-0 left-0 right-0 bg-base-100 border-t border-base-300 z-50">
          <div class="flex justify-around items-center p-2 w-full max-w-full overflow-x-auto">
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
      </div>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import IconUser from '~icons/lucide/user'
import IconType from '~icons/lucide/type'
import IconShoppingBag from '~icons/lucide/shopping-bag'
import IconRuler from '~icons/lucide/ruler'
import IconMessageCircle from '~icons/lucide/message-circle'
import IconPalette from '~icons/lucide/palette'
import IconEye from '~icons/lucide/eye'
import IconMousePointer from '~icons/lucide/mouse-pointer'
import { useReaderSettingsStore } from '~/stores/useReaderSettingsStore'

import AccountSettings from './AccountSettings.vue'
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

const activeTab = ref<string>('account')
const readerStore = useReaderSettingsStore()

const tabs: TabItem[] = [
  { id: 'account', label: 'Account', icon: IconUser },
  { id: 'typography', label: 'Typography', icon: IconType },
  { id: 'marketplace', label: 'Marketplace', icon: IconShoppingBag },
  { id: 'furigana', label: 'Furigana', icon: IconRuler },
  { id: 'tooltip', label: 'Tooltip', icon: IconMessageCircle },
  { id: 'highlighting', label: 'Highlighting', icon: IconPalette },
  { id: 'display', label: 'Display', icon: IconEye },
  { id: 'interaction', label: 'Interaction', icon: IconMousePointer }
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