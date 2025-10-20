<template>
  <div class="page-container">
    <h1 class="title">🧪 Pinia Test Page</h1>

    <div class="input-section">
      <input
        v-model="newItem"
        type="text"
        placeholder="Enter an item"
        @keyup.enter="addItem"
      />
      <button @click="addItem">Add</button>
      <button @click="clearItems" class="clear-btn">Clear</button>
    </div>

    <ul class="item-list">
      <li v-for="(item, index) in store.items" :key="index">
        {{ item }}
        <button @click="remove(index)">×</button>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useItemsStore } from '~/stores/useItemsStore'

// No need to manually pass pinia instance
const store = useItemsStore()

const newItem = ref('')

function addItem() {
  if (newItem.value.trim()) {
    store.addItem(newItem.value)
    newItem.value = ''
  }
}

function remove(index: number) {
  store.removeItem(index)
}

function clearItems() {
  store.clear()
}
</script>

<style scoped>
.page-container {
  max-width: 500px;
  margin: 2rem auto;
  padding: 1rem;
  font-family: system-ui, sans-serif;
  text-align: center;
  background: #fafafa;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
.title {
  font-size: 1.5rem;
  margin-bottom: 1rem;
}
.input-section {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
  margin-bottom: 1rem;
}
input {
  flex: 1;
  padding: 0.5rem;
  border-radius: 4px;
  border: 1px solid #ccc;
}
button {
  padding: 0.5rem 1rem;
  font-weight: bold;
  cursor: pointer;
  border: none;
  border-radius: 4px;
}
button:hover {
  background-color: #f0f0f0;
}
.clear-btn {
  background-color: #fde2e2;
}
.item-list {
  list-style: none;
  padding: 0;
}
.item-list li {
  display: flex;
  justify-content: space-between;
  background: #f5f5f5;
  padding: 0.5rem;
  border-radius: 4px;
  margin-bottom: 0.3rem;
}
</style>