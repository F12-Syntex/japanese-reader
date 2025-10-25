<template>
  <div class="h-full">
    <BookReader />
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'default'
})

const booksStore = useBooksStore()

onMounted(() => {
  if (!booksStore.currentBook) {
    navigateTo('/books')
  }
})
</script>