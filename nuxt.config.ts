// nuxt.config.ts
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  modules: [
    '@nuxtjs/tailwindcss',
    'unplugin-icons/nuxt',
    '@pinia/nuxt',
    '@pinia-plugin-persistedstate/nuxt'
  ],
  css: ['~/assets/css/main.css'],
  app: {
    head: {
      title: 'Japanese Reader',
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { charset: 'utf-8' }
      ]
    }
  },
  srcDir: 'app/',
  nitro: {
    preset: 'vercel',
    serverAssets: [
      {
        baseName: 'dict',
        dir: './node_modules/kuromoji/dict'
      }
    ],
    // Optional for manual debugging/downloads; not needed for runtime
    publicAssets: [
      {
        baseURL: '/dict',
        dir: './node_modules/kuromoji/dict'
      }
    ]
  }
})