import { defineStore } from 'pinia'
import type { FontItem } from '~/types/fonts'

export interface FontItemExtended extends FontItem {
  googleFontUrl?: string
  importUrl?: string
}

const JAPANESE_FONTS = [
  {
    name: 'Noto Sans JP',
    value: 'Noto Sans JP',
    source: 'google' as const,
    importUrl: 'https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@300;400;500;700&display=swap'
  },
  {
    name: 'Noto Serif JP',
    value: 'Noto Serif JP',
    source: 'google' as const,
    importUrl: 'https://fonts.googleapis.com/css2?family=Noto+Serif+JP:wght@300;400;500;700&display=swap'
  },
  {
    name: 'Playfair Display',
    value: 'Playfair Display',
    source: 'google' as const,
    importUrl: 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&display=swap'
  },
  {
    name: 'Poppins',
    value: 'Poppins',
    source: 'google' as const,
    importUrl: 'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap'
  },
  {
    name: 'Inter',
    value: 'Inter',
    source: 'google' as const,
    importUrl: 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap'
  },
  {
    name: 'IBM Plex Sans JP',
    value: 'IBM Plex Sans JP',
    source: 'google' as const,
    importUrl: 'https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+JP:wght@300;400;500;700&display=swap'
  },
  {
    name: 'Roboto',
    value: 'Roboto',
    source: 'google' as const,
    importUrl: 'https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap'
  },
  {
    name: 'M PLUS 1',
    value: 'M PLUS 1',
    source: 'google' as const,
    importUrl: 'https://fonts.googleapis.com/css2?family=M+PLUS+1:wght@300;400;500;700&display=swap'
  },
  {
    name: 'M PLUS Rounded 1c',
    value: 'M PLUS Rounded 1c',
    source: 'google' as const,
    importUrl: 'https://fonts.googleapis.com/css2?family=M+PLUS+Rounded+1c:wght@300;400;500;700&display=swap'
  },
  {
    name: 'Kiwi Maru',
    value: 'Kiwi Maru',
    source: 'google' as const,
    importUrl: 'https://fonts.googleapis.com/css2?family=Kiwi+Maru:wght@300;400;500&display=swap'
  },
  {
    name: 'Hachi Maru Pop',
    value: 'Hachi Maru Pop',
    source: 'google' as const,
    importUrl: 'https://fonts.googleapis.com/css2?family=Hachi+Maru+Pop&display=swap'
  },
  {
    name: 'Zen Kaku Gothic New',
    value: 'Zen Kaku Gothic New',
    source: 'google' as const,
    importUrl: 'https://fonts.googleapis.com/css2?family=Zen+Kaku+Gothic+New:wght@300;400;500;700;900&display=swap'
  }
]

const STORAGE_KEY = 'installedFonts'
const SYSTEM_FONT = 'Noto Sans JP'

export const useFontStore = defineStore('fonts', {
  state: () => ({
    downloadable: JAPANESE_FONTS as FontItemExtended[],
    loading: false as boolean | string,
    loadedFonts: new Set<string>() as Set<string>,
    customError: '' as string
  }),
  getters: {
    downloadableFonts: (s) => s.downloadable.filter(f => !s.loadedFonts.has(f.value)),
    installedFonts: (s) => {
      const installed: FontItemExtended[] = [
        { name: 'System Default', value: SYSTEM_FONT, source: 'system' as const }
      ]
      
      s.loadedFonts.forEach(fontValue => {
        const font = JAPANESE_FONTS.find(f => f.value === fontValue)
        if (font) {
          installed.push(font as FontItemExtended)
        } else {
          // Custom font fallback
          installed.push({ name: fontValue.replace(/['"]/g, ''), value: fontValue, source: 'custom' as const })
        }
      })
      
      return installed
    }
  },
  actions: {
    getLinkId(fontValue: string): string {
      return `font-${fontValue.replace(/\s+/g, '-').toLowerCase()}`
    },
    extractFontFamily(css: string): string {
      const match = css.match(/@font-face\s*\{[^}]*font-family\s*:\s*['"]?([^'";]+)['"]?/i)
      if (match) {
        const raw = match[1] ?? ''
        const family = raw.trim()
        if (!family) return 'Custom Font'
        // Handle quoted or unquoted, and return quoted if needed
        return family.includes(' ') ? `'${family}'` : family
      }
      return 'Custom Font'
    },
    async installFont(font: FontItemExtended) {
      if (!import.meta.client) return
      
      if (this.loadedFonts.has(font.value)) return
      
      this.loading = font.value
      
      try {
        if (font.source === 'google' && font.importUrl) {
          await this.injectFont(font)
        }
      } catch (error) {
        console.error(`Failed to install font: ${font.value}`, error)
      } finally {
        this.loading = false
      }
    },
    async injectFont(font: FontItemExtended): Promise<boolean> {
      if (!import.meta.client) return false
      
      const url = font.importUrl
      if (!url) return false
      
      const linkId = this.getLinkId(font.value)
      
      if (document.getElementById(linkId)) {
        this.loadedFonts.add(font.value)
        this.persistInstalledFonts()
        return true
      }
      
      return new Promise((resolve) => {
        try {
          const link = document.createElement('link')
          link.href = url
          link.rel = 'stylesheet'
          link.id = linkId
          link.dataset.fontFamily = font.value
          link.dataset.fontSource = font.source
          
          link.onload = () => {
            this.loadedFonts.add(font.value)
            this.persistInstalledFonts()
            resolve(true)
          }
          
          link.onerror = () => {
            console.error(`Failed to load font: ${font.value}`)
            resolve(false)
          }
          
          document.head.appendChild(link)
          
          setTimeout(() => {
            if (!this.loadedFonts.has(font.value)) {
              this.loadedFonts.add(font.value)
              this.persistInstalledFonts()
            }
            resolve(true)
          }, 2000)
        } catch (error) {
          console.error(`Error injecting font ${font.value}:`, error)
          resolve(false)
        }
      })
    },
    async addCustomFont(url: string) {
      if (!import.meta.client || !url) {
        this.customError = 'Invalid URL'
        return
      }

      this.loading = 'custom'
      this.customError = ''

      try {
        // Fetch CSS to extract font family
        const response = await fetch(url)
        if (!response.ok) {
          throw new Error(`Failed to fetch CSS: ${response.status}`)
        }
        const css = await response.text()
        const fontFamily = this.extractFontFamily(css)
        const fontValue = fontFamily // Already quoted if needed

        if (this.loadedFonts.has(fontValue)) {
          throw new Error('Font already installed')
        }

        // Check if it's a predefined font
        const predefined = JAPANESE_FONTS.find(f => f.importUrl === url)
        if (predefined) {
          await this.installFont(predefined)
          return
        }

        // For custom, inject link
        const linkId = this.getLinkId(fontValue)
        if (document.getElementById(linkId)) {
          this.loadedFonts.add(fontValue)
          this.persistInstalledFonts()
          return
        }

        await new Promise((resolve, reject) => {
          const link = document.createElement('link')
          link.href = url
          link.rel = 'stylesheet'
          link.id = linkId
          link.dataset.fontFamily = fontValue
          link.dataset.fontSource = 'custom'

          link.onload = () => {
            this.loadedFonts.add(fontValue)
            this.persistInstalledFonts()
            resolve(true)
          }

          link.onerror = () => {
            reject(new Error(`Failed to load custom font from ${url}`))
          }

          document.head.appendChild(link)

          setTimeout(() => {
            if (!this.loadedFonts.has(fontValue)) {
              this.loadedFonts.add(fontValue)
              this.persistInstalledFonts()
            }
            resolve(true)
          }, 2000)
        })
      } catch (error) {
        console.error('Failed to add custom font:', error)
        this.customError = error instanceof Error ? error.message : 'Failed to add custom font'
      } finally {
        this.loading = false
      }
    },
    removeFont(fontValue: string) {
      if (!import.meta.client) return
      
      if (fontValue === SYSTEM_FONT) return
      
      const linkId = this.getLinkId(fontValue)
      const link = document.getElementById(linkId)
      
      if (link) {
        link.remove()
      }
      
      this.loadedFonts.delete(fontValue)
      this.persistInstalledFonts()
    },
    async loadInstalledFontsOnMount() {
      if (!import.meta.client) return
      
      const saved = localStorage.getItem(STORAGE_KEY)
      if (!saved) return
      
      try {
        const fontValues = JSON.parse(saved) as string[]
        
        for (const fontValue of fontValues) {
          // For predefined
          const font = JAPANESE_FONTS.find(f => f.value === fontValue)
          if (font) {
            await this.injectFont(font as FontItemExtended)
          } else {
            console.warn(`Custom font ${fontValue} not re-injected (URL not persisted)`)
          }
        }
      } catch (error) {
        console.error('Error loading installed fonts:', error)
        localStorage.removeItem(STORAGE_KEY)
      }
    },
    persistInstalledFonts() {
      if (!import.meta.client) return
      
      const fontArray = Array.from(this.loadedFonts)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(fontArray))
    }
  }
})