// nuxt.config.ts
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },

  modules: [
    '@nuxtjs/tailwindcss',
    'unplugin-icons/nuxt',
    '@pinia/nuxt',
    '@pinia-plugin-persistedstate/nuxt',
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

  // IMPORTANT: your source lives under app/
  srcDir: 'app/',

  nitro: {
    // Ensure Node serverless on Vercel (not edge)
    preset: 'vercel',

    // Serve Kuromoji dict from node_modules at /dict
    // You already confirmed /dict/base.dat.gz works with this.
    publicAssets: [
      {
        baseURL: '/dict',
        dir: './node_modules/kuromoji/dict'
      }
    ]
  }
})