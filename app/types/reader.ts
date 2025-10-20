export interface ReaderSettings {
  fontFamily: string
  fontSize: number
  fontWeight: number
  lineHeight: number
  letterSpacing: number
  textAlign: 'left' | 'center' | 'right' | 'justify'
  maxWidth: 'full' | '2xl' | '4xl' | '6xl'
  showWordSpacing: boolean
  verticalText: boolean
  furiganaSize: number
  furiganaColor: string
  showFurigana: boolean
  centeredFurigana: boolean
  showTooltip: boolean
  showKanjiInfo: boolean
  kanjiInfoPosition: 'tooltip' | 'popup' | 'sidebar'
  hiraganaColor: string
  katakanaColor: string
  kanjiColor: string
  unknownWordColor: string
  furiganaShowNotes: boolean
  furiganaShowExamples: boolean
  grammarShowNotes: boolean
}

export const defaultReaderSettings: ReaderSettings = {
  fontFamily: 'Noto Sans JP',
  fontSize: 18,
  fontWeight: 400,
  lineHeight: 1.8,
  letterSpacing: 0,
  textAlign: 'left',
  maxWidth: '2xl',
  showWordSpacing: false,
  verticalText: false,
  furiganaSize: 0.5,
  furiganaColor: '#6366f1',
  showFurigana: true,
  centeredFurigana: true,
  showTooltip: true,
  showKanjiInfo: true,
  kanjiInfoPosition: 'tooltip',
  hiraganaColor: '#000000',
  katakanaColor: '#000000',
  kanjiColor: '#000000',
  unknownWordColor: '#ef4444',
  furiganaShowNotes: false,
  furiganaShowExamples: false,
  grammarShowNotes: false
}