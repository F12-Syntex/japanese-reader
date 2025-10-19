export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  
  modules: [
    '@nuxtjs/tailwindcss',
    'unplugin-icons/nuxt'
  ],
  
  css: ['~/assets/css/main.css'],
  
  app: {
    head: {
      title: 'Japanese Reader',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' }
      ]
    }
  },

  srcDir: 'app/',

  nitro: {
    // Easiest: let Vercel handle server routes as functions
    preset: 'vercel'
  }
})