// app/composables/useSentenceAnalysis.ts
import { useAnalysisStore } from '~/stores/useAnalysisStore'
import { useOpenAI } from '~/composables/useOpenAI'
import { useJapaneseText } from '~/composables/useJapaneseText'
import type { AnalysisResult } from '~/types/analysis'

export const useSentenceAnalysis = () => {
  const { getApiKey } = useOpenAI()
  const { japaneseText } = useJapaneseText()
  const cache = useAnalysisStore()

  const COLORS = {
    subject: '#EF4444',
    particle: '#F59E0B',
    object: '#3B82F6',
    verb: '#10B981',
    adjective: '#8B5CF6',
    other: '#6B7280'
  }

  const analyzeSentence = async (sentence: any): Promise<AnalysisResult> => {
    const apiKey = getApiKey()
    if (!apiKey) throw new Error('API key not found')

    const sentenceText = sentence.words.map((w: any) => w.kanji).join('')
    const cached = cache.get(sentenceText)
    if (cached) return cached

    const allSentences = japaneseText.value.map((s: any) => s.words.map((w: any) => w.kanji).join(''))
    const response = await fetch('/api/analyze-sentence', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey, sentence: sentenceText, words: sentence.words, allSentences })
    })
    if (!response.ok) throw new Error('Failed to analyze sentence')
    const data = await response.json()
    const result = formatAnalysis(data.analysis, sentence, COLORS)
    cache.set(sentenceText, result)
    return result
  }

  const formatAnalysis = (aiAnalysis: any, sentence: any, COLORS: any): AnalysisResult => {
    const words = sentence.words
    const coloredWords = words.map((w: any) => ({
      word: w.kanji,
      reading: w.kana,
      meaning: w.meaning,
      pos: w.pos,
      color: getColorForPos(w.pos, COLORS)
    }))
    const connections = (aiAnalysis.connections || []).map((conn: any) => {
      const particleIndex = words.findIndex((w: any) => w.kanji === conn.particle)
      const contextBefore = words.slice(Math.max(0, particleIndex - 3), particleIndex).map((w: any) => w.kanji).join('')
      const contextAfter = words.slice(particleIndex + 2, Math.min(words.length, particleIndex + 5)).map((w: any) => w.kanji).join('')
      const fromWord = words.find((w: any) => w.kanji === conn.from)
      const toWord = words.find((w: any) => w.kanji === conn.to)
      const particleWord = words.find((w: any) => w.kanji === conn.particle)
      return {
        order: particleIndex,
        contextBefore,
        from: conn.from,
        fromReading: fromWord?.kana || '',
        particle: conn.particle,
        particleReading: particleWord?.kana || '',
        to: conn.to,
        toReading: toWord?.kana || '',
        contextAfter,
        role: conn.role || getRoleForParticle(conn.particle),
        explanation: conn.explanation || getParticleExplanation(conn.particle),
        fromColor: getColorForPos(fromWord?.pos, COLORS),
        toColor: getColorForPos(toWord?.pos, COLORS),
        particleColor: COLORS.particle
      }
    }).sort((a: any, b: any) => a.order - b.order)

    const verb = words.find((w: any) => w.pos === 'verb')
    const steps = words.map((w: any) => ({ word: w.kanji, reading: w.kana, explanation: w.meaning || w.pos }))
    const translation = aiAnalysis.translation || words.map((w: any) => w.meaning).filter(Boolean).join(' ')
    return {
      translation,
      storyContext: aiAnalysis.storyContext || '',
      connections,
      coloredWords,
      verb: verb ? { word: verb.kanji, reading: verb.kana, meaning: verb.meaning } : null,
      steps,
      references: aiAnalysis.references || []
    }
  }

  const getColorForPos = (pos: string, COLORS: any) => {
    const p = pos?.toLowerCase() || ''
    if (p.includes('noun')) return COLORS.subject
    if (p.includes('particle')) return COLORS.particle
    if (p.includes('verb')) return COLORS.verb
    if (p.includes('adjective')) return COLORS.adjective
    return COLORS.other
  }

  const getRoleForParticle = (particle: string) => {
    const roles: Record<string, string> = {
      'は': 'Topic Marker',
      'が': 'Subject Marker',
      'を': 'Object Marker',
      'に': 'Direction/Time',
      'で': 'Location/Means',
      'と': 'With/And',
      'も': 'Also/Too',
      'の': 'Possessive',
      'へ': 'Direction',
      'から': 'From',
      'まで': 'Until'
    }
    return roles[particle] || 'Particle'
  }

  const getParticleExplanation = (particle: string) => {
    const explanations: Record<string, string> = {
      'は': 'Marks the topic of the sentence',
      'が': 'Marks the grammatical subject',
      'を': 'Marks the direct object',
      'に': 'Indicates direction, time, or indirect object',
      'で': 'Indicates location of action or means',
      'と': 'Connects nouns (and/with)',
      'も': 'Adds emphasis (also/too)',
      'の': 'Shows possession or modification',
      'へ': 'Indicates direction toward',
      'から': 'Indicates starting point (from)',
      'まで': 'Indicates ending point (until)'
    }
    return explanations[particle] || 'Connects elements'
  }

  return { analyzeSentence }
}