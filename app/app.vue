<template>
  <div class="min-h-screen bg-base-200">
    <!-- Header -->
    <header class="bg-base-100 border-b border-base-300">
      <div class="max-w-7xl mx-auto px-4">
        <div class="flex items-center justify-between h-16">
          <!-- Tabs -->
          <div class="tabs tabs-boxed bg-transparent">
            <a 
              class="tab" 
              :class="{ 'tab-active': activeTab === 'reader' }"
              @click="activeTab = 'reader'"
            >
              <IconBook class="w-4 h-4 mr-2" />
              Reader
            </a>
          </div>

          <!-- Theme Switcher -->
          <div class="dropdown dropdown-end">
            <label tabindex="0" class="btn btn-ghost btn-sm gap-2">
              <IconPalette class="w-5 h-5" />
              Theme
            </label>
            <ul tabindex="0" class="dropdown-content z-[1] p-2 shadow-2xl bg-base-300 rounded-box w-52 mt-4">
              <li v-for="theme in themes" :key="theme">
                <button 
                  @click="setTheme(theme)"
                  class="btn btn-sm btn-block btn-ghost justify-start"
                  :class="{ 'btn-active': currentTheme === theme }"
                >
                  <IconCheck v-if="currentTheme === theme" class="w-4 h-4" />
                  <span class="w-4" v-else></span>
                  {{ theme }}
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto px-4 py-8">
      <!-- Reader Tab -->
      <div v-if="activeTab === 'reader'">
        <div class="card bg-base-100 shadow-xl">
          <div class="card-body">
            <h2 class="card-title">Reader</h2>
            <p>Reader content goes here</p>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import IconBook from '~icons/lucide/book-open'
import IconPalette from '~icons/lucide/palette'
import IconCheck from '~icons/lucide/check'

const themes = ['light', 'dark', 'cupcake', 'forest', 'aqua', 'luxury', 'dracula', 'night']
const currentTheme = ref('forest')
const activeTab = ref('reader')

const setTheme = (theme) => {
  currentTheme.value = theme
  if (process.client) {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }
}

onMounted(() => {
  const savedTheme = localStorage.getItem('theme') || 'forest'
  currentTheme.value = savedTheme
  document.documentElement.setAttribute('data-theme', savedTheme)
})
</script>