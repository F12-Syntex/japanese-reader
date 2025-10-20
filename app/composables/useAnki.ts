import { useAnkiStore } from '~/stores/useAnkiStore'

export const useAnki = () => {
  const store = useAnkiStore()
  
  return {
    knownWords: computed(() => store.knownWords),
    isLoading: computed(() => store.isLoading),
    error: computed(() => store.error),
    processAnkiFile: store.processAnkiFile,
    isWordKnown: store.isWordKnown,
    getWordData: store.getWordData,
    getKnownWordsList: store.getKnownWordsList,
    clearAnkiData: store.clearAnkiData,
    loadFromStorage: store.loadFromStorage
  }
}