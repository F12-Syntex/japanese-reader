<template>
  <span :style="{ color: randomColor }">
    <slot />
  </span>
</template>

<script setup lang="ts">
const randomColor = `hsl(${Math.floor(Math.random() * 360)}, 70%, 50%)`
</script>