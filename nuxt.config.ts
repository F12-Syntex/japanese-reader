import { defineNuxtConfig } from 'nuxt/config'
import Icons from 'unplugin-icons/vite'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss'],
  css: ['~/assets/css/main.css'],
  vite: {
    plugins: [
      Icons({
        autoInstall: true,
      }),
    ],
  },
})