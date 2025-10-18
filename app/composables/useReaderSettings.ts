// composables/useReaderSettings.ts
export const useReaderSettings = () => {
  const defaultSettings = {
    fontFamily: 'Noto Sans JP',
    fontSize: 28,
    fontWeight: 400,
    lineHeight: 2.8,
    letterSpacing: 0,
    furiganaSize: 0.45,
    furiganaColor: '',
    showFurigana: false,
    showTooltip: true,
    tooltipSize: 'md',
    tooltipDelay: 0,
    alwaysShowTranslation: false,
    translationSize: 10,
    translationGap: 4,
    highlightParticles: false,
    highlightVerbs: false,
    highlightAdjectives: false,
    highlightOnHover: false,
    underlineUnknown: false,
    textColor: '',
    backgroundColor: '',
    textAlign: 'left',
    maxWidth: 'full',
    showWordSpacing: false,
    verticalText: false,
    showSentenceNumbers: false,
    clickToToggle: true,
    showPitchAccent: false,
    showPartOfSpeech: true,
    focusModeOpacity: 30,
    autoScroll: false,
    highlightKnownWords: true,
    dimKnownWords: false,
    strikethroughKnown: false,
    grammarMode: false,
    grammarShowArrows: true,
    grammarShowLabels: true,
    grammarShowTranslation: true,
    grammarArrowThickness: 2.5,
    grammarArrowOpacity: 70,
    grammarSubjectColor: '#EF4444',
    grammarObjectColor: '#3B82F6',
    grammarParticleColor: '#F59E0B',
    grammarVerbColor: '#10B981',
    grammarModifierColor: '#8B5CF6',
    grammarLabelSize: 11,
    grammarLineSpacing: 40,
    grammarHighlightOnHover: true,
    grammarAnimateArrows: false,
    grammarShowNotes: true,
  };

  const settings = useState('readerSettings', () => ({ ...defaultSettings }));

  const loadSettings = () => {
    if (import.meta.client) {
      const savedSettings = localStorage.getItem('readerSettings');
      if (savedSettings) {
        settings.value = { ...defaultSettings, ...JSON.parse(savedSettings) };
      }
    }
  };

  const resetSettings = () => {
    settings.value = { ...defaultSettings };
    if (import.meta.client) {
      localStorage.removeItem('readerSettings');
    }
  };

  if (import.meta.client) {
    watch(settings, (newSettings) => {
      localStorage.setItem('readerSettings', JSON.stringify(newSettings));
    }, { deep: true });
  }

  return {
    settings,
    loadSettings,
    resetSettings,
    defaultSettings,
  };
};