<template>
  <div
    class="absolute"
    :style="{
      left: block.x * zoom + 'px',
      top: block.y * zoom + 'px',
      width: block.width * zoom + 'px',
      minHeight: block.height * zoom + 'px',
    }"
  >
    <p
      :class="[
        'leading-tight m-0 p-0 select-text cursor-text hover:bg-yellow-100/50 transition-colors',
        alignmentClass
      ]"
      :style="{
        fontSize: block.fontSize * zoom + 'px',
        lineHeight: 1.2,
      }"
      @click="handleClick"
    >
      <span
        v-for="(item, idx) in block.items"
        :key="idx"
        class="inline"
      >{{ item.text }}</span>
    </p>
  </div>
</template>

<script setup lang="ts">
interface TextItem {
  text: string
  x: number
  y: number
  width: number
  height: number
  fontSize: number
  fontName: string
}

interface TextBlock {
  items: TextItem[]
  x: number
  y: number
  width: number
  height: number
  fontSize: number
  alignment: 'left' | 'center' | 'right'
}

interface Props {
  block: TextBlock
  zoom: number
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'text-click': [text: string]
}>()

const alignmentClass = computed(() => {
  switch (props.block.alignment) {
    case 'center': return 'text-center'
    case 'right': return 'text-right'
    default: return 'text-left'
  }
})

const handleClick = () => {
  const fullText = props.block.items.map(i => i.text).join('')
  emit('text-click', fullText)
}
</script>