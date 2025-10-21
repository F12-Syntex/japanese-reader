export interface ReaderSettings {
  fontSize: number
  fontFamily: string
  fontWeight: number
  lineHeight: number
  letterSpacing: number
  textAlign: 'left' | 'center' | 'right' | 'justify'
  maxWidth: 'full' | '2xl' | '4xl' | '6xl'
  verticalText: boolean
  showFurigana: boolean
  furiganaSize: number
  furiganaPosition: 'above' | 'inline'
  centeredFurigana: boolean
  showTooltip: boolean
  tooltipSize: 'sm' | 'md' | 'lg'
  tooltipDelay: number
  showPartOfSpeech: boolean
  showJLPTLevel: boolean
  showPitchAccent: boolean
  showExample: boolean
  highlightParticles: boolean
  highlightVerbs: boolean
  highlightAdjectives: boolean
  highlightNouns: boolean
  highlightKnownWords: boolean
  knownWordOpacity: number
  dimKnownWords: boolean
  strikethroughKnown: boolean
  underlineUnknown: boolean
  showWordSpacing: boolean
  alwaysShowTranslation: boolean
  translationSize: number
  translationGap: number
  showSentenceNumbers: boolean
  sentenceNumberPosition: 'left' | 'right'
  clickToToggle: boolean
  autoScroll: boolean
  focusModeOpacity: number
  highlightGrammar: boolean
  grammarTooltip: boolean
}

export const defaultReaderSettings: ReaderSettings = {
  fontSize: 48,
  fontFamily: 'Noto Sans JP',
  fontWeight: 400,
  lineHeight: 1.8,
  letterSpacing: 0,
  textAlign: 'left',
  maxWidth: 'full',
  verticalText: false,
  showFurigana: true,
  furiganaSize: 0.45,
  furiganaPosition: 'above',
  centeredFurigana: true,
  showTooltip: true,
  tooltipSize: 'md',
  tooltipDelay: 10,
  showPartOfSpeech: true,
  showJLPTLevel: true,
  showPitchAccent: true,
  showExample: true,
  highlightParticles: true,
  highlightVerbs: true,
  highlightAdjectives: true,
  highlightNouns: false,
  highlightKnownWords: false,
  knownWordOpacity: 100,
  dimKnownWords: false,
  strikethroughKnown: false,
  underlineUnknown: false,
  showWordSpacing: true,
  alwaysShowTranslation: false,
  translationSize: 10,
  translationGap: 4,
  showSentenceNumbers: false,
  sentenceNumberPosition: 'left',
  clickToToggle: false,
  autoScroll: false,
  focusModeOpacity: 50,
  highlightGrammar: false,
  grammarTooltip: true
}