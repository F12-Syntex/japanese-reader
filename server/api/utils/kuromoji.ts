import * as kuromoji from '@patdx/kuromoji'
import { join } from 'path'
import wanakana from 'wanakana'
import { existsSync } from 'fs'

let tokenizer : any = null

const myLoader: kuromoji.LoaderConfig = {
  async loadArrayBuffer(url: string): Promise<ArrayBufferLike> {
    url = url.replace('.gz', '')
    const res = await fetch(
      'https://cdn.jsdelivr.net/npm/@aiktb/kuromoji@1.0.2/dict/' + url,
    )
    if (!res.ok) {
      throw new Error(`Failed to fetch ${url}, status: ${res.status}`)
    }
    return res.arrayBuffer()
  },
}

export const getKuromojiTokenizer = async () => {
  if (tokenizer) return tokenizer

  tokenizer = await new kuromoji.TokenizerBuilder({
    loader: myLoader,
  }).build()

  return tokenizer
}

export const tokenizeText = async (text: string): Promise<kuromoji.IpadicFeatures[]> => {
  const tk = await getKuromojiTokenizer()
  return tk.tokenize(text)
}

export const mapPOS = (pos: string): string => {
  if (pos.includes('名詞')) return 'noun'
  if (pos.includes('動詞')) return 'verb'
  if (pos.includes('形容詞')) return 'adjective'
  if (pos.includes('助詞')) return 'particle'
  if (pos.includes('副詞')) return 'adverb'
  return 'other'
}

export const extractReading = (token: kuromoji.IpadicFeatures): string => {
  if (!token.reading) return token.surface_form
  return wanakana.toHiragana(token.reading)
}