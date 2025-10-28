<template>
  <span class="jp-word">{{ word.text }}</span>
</template>

<script setup lang="ts">
defineProps<{ word: any }>()
</script>