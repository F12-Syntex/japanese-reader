<template>
  <span :style="{ color: randomColor }">
    <slot />
  </span>
</template>

<script setup lang="ts">
const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B88B', '#AAB7B8']

const randomColor = colors[Math.floor(Math.random() * colors.length)]
</script>