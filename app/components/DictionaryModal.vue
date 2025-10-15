// components/DictionaryModal.vue
<template>
  <dialog ref="modal" class="modal">
    <div class="modal-box max-w-4xl h-[80vh]">
      <form method="dialog">
        <button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>
      </form>
      <h3 class="font-bold text-lg mb-4">{{ word?.kanji || '' }}</h3>
      <div class="h-[calc(100%-3rem)] overflow-hidden">
        <iframe
          v-if="word"
          :src="`https://www.japandict.com/${encodeURIComponent(word.kanji)}`"
          class="w-full h-full border-0"
        ></iframe>
      </div>
    </div>
    <form method="dialog" class="modal-backdrop">
      <button>close</button>
    </form>
  </dialog>
</template>

<script setup>
const modal = ref(null)
const word = ref(null)

const open = (wordData) => {
  word.value = wordData
  modal.value?.showModal()
}

const close = () => {
  modal.value?.close()
  word.value = null
}

defineExpose({
  open,
  close
})
</script>