import kuromoji from 'kuromoji'
import wanakana from 'wanakana'

let tokenizer: any = null

export const getKuromojiTokenizer = async (): Promise<any> => {
  if (tokenizer) return tokenizer

  return new Promise((resolve, reject) => {
    kuromoji.builder({ dicPath: '/dict' }).build((err: any, _tokenizer: any) => {
      if (err) reject(err)
      else {
        tokenizer = _tokenizer
        resolve(tokenizer)
      }
    })
  })
}

export const tokenizeText = async (text: string): Promise<any[]> => {
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

export const extractReading = (token: any): string => {
  if (!token.reading) return token.surface_form
  return wanakana.toHiragana(token.reading)
}