interface GrammarPoint {
  level: string
  grammarPoint: string
  japanese: string
  english: string
  userScore?: number
}

export const useGrammarCatalog = () => {
  const grammarPoints = useState<GrammarPoint[]>('grammarPoints', () => [])
  const userScores = useState<Record<string, number>>('grammarScores', () => ({}))

  const parseCSVLine = (line: string): [string, string, string, string] | null => {
    // Improved CSV parser for quoted fields with commas
    const regex = /"([^"]*)"|[^,]+/g
    const matches: string[] = []
    let match
    let inQuotes = false
    let currentField = ''
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === ',' && !inQuotes) {
        matches.push(currentField.trim())
        currentField = ''
      } else {
        currentField += char
      }
    }
    matches.push(currentField.trim())
    
    if (matches.length >= 4) {
      const [level = '', grammarPoint = '', japanese = '', english = ''] = matches
      return [
        String(level).replace(/"/g, '').trim(),
        String(grammarPoint).replace(/"/g, '').trim(),
        String(japanese).replace(/"/g, '').trim(),
        String(english).replace(/"/g, '').trim().replace(/&amp;#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>')
      ]
    }
    return null
  }

  const loadGrammarPoints = async () => {
    if (grammarPoints.value.length > 0) return

    try {
      const response = await fetch('/grammar_points.csv')
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const csvText = await response.text()
      if (!csvText.trim()) {
        throw new Error('CSV file is empty')
      }
      
      const lines = csvText.trim().split('\n').slice(1) // Skip header
      
      const points: GrammarPoint[] = []
      let validLines = 0
      lines.forEach((line, index) => {
        const trimmedLine = line.trim()
        if (!trimmedLine) return
        
        const parsed = parseCSVLine(trimmedLine)
        if (parsed) {
          const [level, grammarPoint, japanese, english] = parsed
          if (level && grammarPoint && japanese && english) {
            points.push({
              level,
              grammarPoint,
              japanese,
              english
            })
            validLines++
          }
        } else {
          console.warn(`Failed to parse line ${index + 2}: ${trimmedLine.substring(0, 50)}...`)
        }
      })

      if (points.length === 0) {
        throw new Error('No valid grammar points found in CSV')
      }

      const scores = userScores.value
      grammarPoints.value = points.map(point => ({
        ...point,
        userScore: scores[point.grammarPoint] ?? 0
      }))
      
      console.log(`Loaded ${points.length} grammar points from CSV (${validLines} valid lines)`)
    } catch (error) {
      console.error('Failed to load grammar points from /grammar_points.csv:', error)
      
      // Enhanced fallback with more sample data
      grammarPoints.value = [
        { level: 'N5', grammarPoint: 'です', japanese: 'です', english: 'To be (polite)', userScore: 0 },
        { level: 'N5', grammarPoint: 'ます', japanese: 'ます', english: 'Polite verb ending', userScore: 0 },
        { level: 'N5', grammarPoint: 'は', japanese: 'は', english: 'Topic marker', userScore: 0 },
        { level: 'N5', grammarPoint: 'も', japanese: 'も', english: 'Also/too', userScore: 0 },
        { level: 'N5', grammarPoint: 'これ', japanese: 'これ', english: 'This (thing)', userScore: 0 },
        { level: 'N5', grammarPoint: 'それ', japanese: 'それ', english: 'That (thing)', userScore: 0 },
        { level: 'N4', grammarPoint: 'て form', japanese: 'て形', english: 'Connective verb form', userScore: 0 },
        { level: 'N4', grammarPoint: 'たい', japanese: 'たい', english: 'Want to (verb)', userScore: 0 },
        { level: 'N3', grammarPoint: 'ながら', japanese: 'ながら', english: 'While doing', userScore: 0 },
        { level: 'N3', grammarPoint: 'ば', japanese: 'ば', english: 'If/when (conditional)', userScore: 0 },
        { level: 'N2', grammarPoint: 'つもり', japanese: 'つもり', english: "Intention to do", userScore: 0 },
        { level: 'N2', grammarPoint: 'ばかり', japanese: 'ばかり', english: 'Just (did)', userScore: 0 },
        { level: 'N1', grammarPoint: 'に違いない', japanese: 'に違いない', english: "Must be (deduction)", userScore: 0 },
        { level: 'N1', grammarPoint: 'かねる', japanese: 'かねる', english: "Find difficult to", userScore: 0 }
      ]
      console.log('Using fallback grammar data')
    }
  }

  const updateScore = (grammarPoint: string, score: number, sessionGrammar?: string[]) => {
    const pointIndex = grammarPoints.value.findIndex(p => p.grammarPoint === grammarPoint)
    if (pointIndex !== -1) {
      const point = grammarPoints.value[pointIndex]
      if (point) {
        point.userScore = Math.max(0, Math.min(100, score))
        userScores.value[grammarPoint] = point.userScore
        if (import.meta.client) {
          localStorage.setItem('grammarScores', JSON.stringify(userScores.value))
        }
        
        // If this grammar point was from a session, adjust difficulty
        if (sessionGrammar && sessionGrammar.includes(grammarPoint)) {
          const { adjustDifficulty } = useDifficulty()
          const delta = score < 40 ? -3 : score < 60 ? -1 : 1
          difficulty.value = Math.max(0, Math.min(100, difficulty.value + delta))
          if (import.meta.client) {
            localStorage.setItem('difficulty', String(difficulty.value))
          }
        }
      }
    }
  }

  const getProficiencyForLevel = (level: string = '') => {
    if (level) {
      const levelPoints = grammarPoints.value.filter(p => p.level === level)
      if (levelPoints.length === 0) return 0
      const avg = levelPoints.reduce((sum, p) => sum + (p.userScore ?? 0), 0) / levelPoints.length
      return Math.round(avg)
    } else {
      if (grammarPoints.value.length === 0) return 0
      const avg = grammarPoints.value.reduce((sum, p) => sum + (p.userScore ?? 0), 0) / grammarPoints.value.length
      return Math.round(avg)
    }
  }

  const loadScores = () => {
    if (import.meta.client) {
      try {
        const saved = localStorage.getItem('grammarScores')
        if (saved) {
          userScores.value = JSON.parse(saved)
          grammarPoints.value.forEach(point => {
            point.userScore = userScores.value[point.grammarPoint] ?? 0
          })
        }
      } catch (error) {
        console.error('Failed to load grammar scores:', error)
        userScores.value = {}
      }
    }
  }

  const resetScores = () => {
    grammarPoints.value.forEach(point => {
      point.userScore = 0
    })
    userScores.value = {}
    if (import.meta.client) {
      localStorage.removeItem('grammarScores')
    }
  }

  const getGrammarByLevel = (level: string) => grammarPoints.value.filter(p => p.level === level)

  const { difficulty } = useDifficulty()

  return {
    grammarPoints,
    userScores,
    loadGrammarPoints,
    updateScore,
    getProficiencyForLevel,
    getOverallProficiency: () => getProficiencyForLevel(''),
    loadScores,
    resetScores,
    getGrammarByLevel
  }
}