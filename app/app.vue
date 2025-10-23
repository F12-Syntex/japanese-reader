<template>
  <NuxtLayout>
    <DictionaryLoader :visible="loading" />
    <NuxtPage />
  </NuxtLayout>
</template>

<script setup lang="ts">
import DictionaryLoader from '~/components/DictionaryLoader.vue'

const { loadDictionary, loading } = useDictionaryStore();

onMounted(async () => {
  await loadDictionary()
})
</script>