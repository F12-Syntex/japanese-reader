<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
<script setup lang="ts">
const fontStore = useFontStore()

onMounted(async () => {
  await fontStore.loadInstalledFontsOnMount()
})
</script>