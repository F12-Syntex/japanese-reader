export interface ReaderSettings {
  fontFamily: string
  fontSize: number
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
  
  showWordSpacing: boolean
  alwaysShowTranslation: boolean
  translationSize: number
  translationGap: number
  
  highlightParticles: boolean
  highlightVerbs: boolean
  highlightAdjectives: boolean
  highlightNouns: boolean
  highlightKnownWords: boolean
  knownWordOpacity: number
  dimKnownWords: boolean
  strikethroughKnown: boolean
  underlineUnknown: boolean
  
  showTooltip: boolean
  tooltipSize: 'sm' | 'md' | 'lg'
  tooltipDelay: number
  showPartOfSpeech: boolean
  showJLPTLevel: boolean
  showPitchAccent: boolean
  showExample: boolean
  
  showSentenceNumbers: boolean
  sentenceNumberPosition: 'left' | 'right'
  
  clickToToggle: boolean
  focusModeOpacity: number
  autoScroll: boolean
}

export const defaultReaderSettings: ReaderSettings = {
  fontFamily: 'Noto Sans JP',
  fontSize: 18,
  fontWeight: 400,
  lineHeight: 1.8,
  letterSpacing: 0,
  textAlign: 'left',
  maxWidth: '2xl',
  verticalText: false,
  
  showFurigana: true,
  furiganaSize: 0.5,
  furiganaPosition: 'above',
  centeredFurigana: true,
  
  showWordSpacing: false,
  alwaysShowTranslation: false,
  translationSize: 10,
  translationGap: 4,
  
  highlightParticles: false,
  highlightVerbs: false,
  highlightAdjectives: false,
  highlightNouns: false,
  highlightKnownWords: true,
  knownWordOpacity: 100,
  dimKnownWords: false,
  strikethroughKnown: false,
  underlineUnknown: false,
  
  showTooltip: true,
  tooltipSize: 'md',
  tooltipDelay: 0,
  showPartOfSpeech: true,
  showJLPTLevel: true,
  showPitchAccent: false,
  showExample: true,
  
  showSentenceNumbers: false,
  sentenceNumberPosition: 'left',
  
  clickToToggle: true,
  focusModeOpacity: 30,
  autoScroll: false
}