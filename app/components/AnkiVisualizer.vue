// components/AnkiVisualizer.vue
<template>
  <div v-if="modelValue" class="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4" @click.self="closeModal">
    <div class="bg-base-100 rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col">
      <div class="p-4 sm:p-6 border-b border-base-300 flex-shrink-0">
        <div class="flex items-start justify-between">
          <div>
            <h2 class="text-xl sm:text-2xl font-bold mb-2">Anki Deck Visualizer</h2>
            <p class="text-sm text-base-content/70">
              <span v-if="hasStoredData">Viewing stored data</span>
              <span v-else>Upload a .colpkg or .apkg file to inspect</span>
            </p>
          </div>
          <div class="flex gap-2">
            <button 
              v-if="fileData"
              @click="copyEssentialData" 
              class="btn btn-primary btn-sm gap-2"
            >
              <IconClipboard class="w-4 h-4" />
              <span class="hidden sm:inline">Copy</span>
            </button>
            <button @click="closeModal" class="btn btn-ghost btn-sm btn-circle">
              <IconX class="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div class="flex-1 overflow-hidden flex flex-col p-4 sm:p-6">
        <div v-if="!fileData" class="flex-1 flex items-center justify-center">
          <div class="text-center max-w-md w-full">
            <div 
              class="border-2 border-dashed border-base-300 rounded-lg p-8 sm:p-12 hover:border-primary transition-colors cursor-pointer"
              @click="triggerFileInput"
              @dragover.prevent="isDragging = true"
              @dragleave.prevent="isDragging = false"
              @drop.prevent="handleDrop"
              :class="{ 'border-primary bg-primary/5': isDragging }"
            >
              <IconUpload class="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 opacity-50" />
              <p class="font-medium text-base sm:text-lg mb-2">Drop .apkg or .colpkg file here</p>
              <p class="text-xs sm:text-sm text-base-content/60 mb-4">or click to browse</p>
              <input 
                ref="fileInput"
                type="file" 
                accept=".apkg,.colpkg"
                class="hidden"
                @change="handleFileSelect"
              />
            </div>
            <div class="alert alert-info mt-4 text-left">
              <IconInfo class="w-5 h-5" />
              <div class="text-sm">
                <p class="font-bold mb-1">Tip:</p>
                <p>Try exporting your deck as .colpkg from Anki</p>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="flex-1 overflow-hidden flex flex-col">
          <div class="mb-4 flex gap-2 flex-shrink-0 overflow-x-auto pb-2">
            <button @click="activeView = 'overview'" class="btn btn-sm whitespace-nowrap" :class="{ 'btn-primary': activeView === 'overview' }">
              Overview
            </button>
            <button @click="activeView = 'files'" class="btn btn-sm whitespace-nowrap" :class="{ 'btn-primary': activeView === 'files' }">
              Files ({{ fileData.files?.length || 0 }})
            </button>
            <button @click="activeView = 'models'" class="btn btn-sm whitespace-nowrap" :class="{ 'btn-primary': activeView === 'models' }">
              Card Types
            </button>
            <button @click="activeView = 'decks'" class="btn btn-sm whitespace-nowrap" :class="{ 'btn-primary': activeView === 'decks' }">
              Decks
            </button>
            <button @click="activeView = 'notes'" class="btn btn-sm whitespace-nowrap" :class="{ 'btn-primary': activeView === 'notes' }">
              Notes ({{ fileData.notes?.length || 0 }})
            </button>
            <button @click="activeView = 'cards'" class="btn btn-sm whitespace-nowrap" :class="{ 'btn-primary': activeView === 'cards' }">
              Cards ({{ fileData.cards?.length || 0 }})
            </button>
            <button @click="activeView = 'raw'" class="btn btn-sm whitespace-nowrap" :class="{ 'btn-primary': activeView === 'raw' }">
              Raw
            </button>
            <button @click="resetVisualizer" class="btn btn-sm btn-error ml-auto whitespace-nowrap">
              <IconTrash class="w-4 h-4" />
            </button>
          </div>

          <div class="flex-1 overflow-y-auto custom-scrollbar bg-base-200 rounded-lg p-4">
            <div v-if="activeView === 'overview'">
              <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                <div class="stats shadow">
                  <div class="stat">
                    <div class="stat-title">Total Notes</div>
                    <div class="stat-value text-primary text-2xl sm:text-3xl">{{ fileData.totalNotes?.toLocaleString() || 0 }}</div>
                    <div class="stat-desc">Showing {{ fileData.notes?.length || 0 }}</div>
                  </div>
                </div>
                <div class="stats shadow">
                  <div class="stat">
                    <div class="stat-title">Total Cards</div>
                    <div class="stat-value text-secondary text-2xl sm:text-3xl">{{ fileData.totalCards?.toLocaleString() || 0 }}</div>
                    <div class="stat-desc">Showing {{ fileData.cards?.length || 0 }}</div>
                  </div>
                </div>
                <div class="stats shadow">
                  <div class="stat">
                    <div class="stat-title">Card Types</div>
                    <div class="stat-value text-accent text-2xl sm:text-3xl">{{ fileData.modelCount || 0 }}</div>
                  </div>
                </div>
              </div>

              <div class="bg-base-100 rounded-lg p-4 mb-4 overflow-x-auto">
                <h3 class="font-bold text-lg mb-3">File Information</h3>
                <table class="table table-sm w-full">
                  <tbody>
                    <tr>
                      <td class="font-medium">File Name</td>
                      <td class="break-all">{{ fileData.fileName }}</td>
                    </tr>
                    <tr>
                      <td class="font-medium">File Size</td>
                      <td>{{ formatBytes(fileData.fileSize) }}</td>
                    </tr>
                    <tr>
                      <td class="font-medium">File Type</td>
                      <td>{{ fileData.fileType }}</td>
                    </tr>
                    <tr>
                      <td class="font-medium">Collection Format</td>
                      <td>{{ fileData.collectionFile || 'Not found' }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div v-if="fileData.tables?.length" class="bg-base-100 rounded-lg p-4">
                <h3 class="font-bold text-lg mb-3">Database Tables</h3>
                <div class="flex flex-wrap gap-2">
                  <div v-for="table in fileData.tables" :key="table" class="badge badge-lg">
                    {{ table }}
                  </div>
                </div>
              </div>
            </div>

            <div v-else-if="activeView === 'files'">
              <div class="bg-base-100 rounded-lg overflow-x-auto">
                <table class="table table-sm">
                  <thead>
                    <tr>
                      <th>File Name</th>
                      <th>Size</th>
                      <th>Type</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(file, index) in fileData.files" :key="index">
                      <td class="font-mono text-xs break-all">{{ file.name }}</td>
                      <td class="whitespace-nowrap">{{ formatBytes(file.size) }}</td>
                      <td>
                        <span class="badge badge-sm whitespace-nowrap" :class="{
                          'badge-primary': file.name.includes('collection'),
                          'badge-secondary': file.name.includes('.db') || file.name.includes('.anki'),
                          'badge-accent': file.name.includes('media')
                        }">
                          {{ getFileType(file.name) }}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div v-else-if="activeView === 'models'">
              <div v-if="fileData.models" class="space-y-4">
                <div v-for="(model, key) in fileData.models" :key="key" class="bg-base-100 rounded-lg p-4">
                  <h3 class="font-bold text-lg mb-3">{{ model.name }}</h3>
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <div>
                      <span class="text-sm opacity-70">Type:</span>
                      <span class="ml-2 badge">{{ model.type === 0 ? 'Standard' : 'Cloze' }}</span>
                    </div>
                    <div>
                      <span class="text-sm opacity-70">Fields:</span>
                      <span class="ml-2">{{ model.flds?.length || 0 }}</span>
                    </div>
                  </div>
                  <div>
                    <h4 class="font-bold text-sm mb-2">Fields:</h4>
                    <div class="flex flex-wrap gap-2">
                      <div v-for="field in model.flds" :key="field.name" class="badge badge-lg">
                        {{ field.name }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div v-else class="alert alert-warning">
                <IconAlertCircle class="w-5 h-5" />
                <span>No card type information found</span>
              </div>
            </div>

            <div v-else-if="activeView === 'decks'">
              <div v-if="fileData.decks" class="space-y-4">
                <div v-for="(deck, key) in fileData.decks" :key="key" class="bg-base-100 rounded-lg p-4">
                  <h3 class="font-bold text-base sm:text-lg mb-3 break-all">{{ deck.name }}</h3>
                  <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div>
                      <div class="text-xs opacity-70">New Today</div>
                      <div class="font-bold">{{ deck.newToday?.[1] || 0 }}</div>
                    </div>
                    <div>
                      <div class="text-xs opacity-70">Review Today</div>
                      <div class="font-bold">{{ deck.revToday?.[1] || 0 }}</div>
                    </div>
                    <div>
                      <div class="text-xs opacity-70">Learn Today</div>
                      <div class="font-bold">{{ deck.lrnToday?.[1] || 0 }}</div>
                    </div>
                    <div>
                      <div class="text-xs opacity-70">Time Today</div>
                      <div class="font-bold">{{ formatTime(deck.timeToday?.[1] || 0) }}</div>
                    </div>
                  </div>
                </div>
              </div>
              <div v-else class="alert alert-warning">
                <IconAlertCircle class="w-5 h-5" />
                <span>No deck information found</span>
              </div>
            </div>

            <div v-else-if="activeView === 'notes'">
              <div v-if="fileData.notes?.length" class="bg-base-100 rounded-lg overflow-x-auto">
                <table class="table table-sm">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Fields</th>
                      <th>Tags</th>
                      <th>Modified</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="note in fileData.notes.slice(0, 100)" :key="note.id">
                      <td class="font-mono text-xs">{{ note.id }}</td>
                      <td class="max-w-xs sm:max-w-md">
                        <div v-for="(field, idx) in note.flds?.split('\u001f').filter(f => f)" :key="idx" class="text-xs truncate">
                          <span class="font-bold">{{ idx + 1 }}:</span> {{ field }}
                        </div>
                      </td>
                      <td class="text-xs">
                        <div class="flex flex-wrap gap-1">
                          <div v-for="tag in note.tags?.split(' ').filter(t => t)" :key="tag" class="badge badge-xs">
                            {{ tag }}
                          </div>
                        </div>
                      </td>
                      <td class="text-xs whitespace-nowrap">{{ formatTimestamp(note.mod) }}</td>
                    </tr>
                  </tbody>
                </table>
                <div v-if="fileData.notes.length > 100" class="p-4 text-center text-sm text-base-content/60">
                  Showing first 100 of {{ fileData.notes.length }} notes
                </div>
              </div>
              <div v-else class="alert alert-warning">
                <IconAlertCircle class="w-5 h-5" />
                <span>No notes found. Try exporting as .colpkg instead of .apkg</span>
              </div>
            </div>

            <div v-else-if="activeView === 'cards'">
              <div v-if="fileData.cards?.length" class="bg-base-100 rounded-lg overflow-x-auto">
                <table class="table table-sm">
                  <thead>
                    <tr>
                      <th>Note ID</th>
                      <th>Type</th>
                      <th>Queue</th>
                      <th>Due</th>
                      <th>Interval</th>
                      <th>Ease</th>
                      <th>Reviews</th>
                      <th>Lapses</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="card in fileData.cards.slice(0, 100)" :key="card.id">
                      <td class="font-mono text-xs">{{ card.nid }}</td>
                      <td>
                        <span class="badge badge-xs whitespace-nowrap" :class="{
                          'badge-primary': card.type === 0,
                          'badge-secondary': card.type === 1,
                          'badge-accent': card.type === 2
                        }">
                          {{ getCardType(card.type) }}
                        </span>
                      </td>
                      <td>
                        <span class="badge badge-xs whitespace-nowrap" :class="{
                          'badge-error': card.queue < 0,
                          'badge-warning': card.queue === 0,
                          'badge-info': card.queue === 1,
                          'badge-success': card.queue >= 2
                        }">
                          {{ getQueueType(card.queue) }}
                        </span>
                      </td>
                      <td class="text-xs">{{ card.due }}</td>
                      <td class="text-xs">{{ card.ivl }}</td>
                      <td class="text-xs">{{ card.factor }}</td>
                      <td class="text-xs">{{ card.reps }}</td>
                      <td class="text-xs">{{ card.lapses }}</td>
                    </tr>
                  </tbody>
                </table>
                <div v-if="fileData.cards.length > 100" class="p-4 text-center text-sm text-base-content/60">
                  Showing first 100 of {{ fileData.cards.length }} cards
                </div>
              </div>
              <div v-else class="alert alert-warning">
                <IconAlertCircle class="w-5 h-5" />
                <span>No cards found</span>
              </div>
            </div>

            <div v-else-if="activeView === 'raw'">
              <div class="bg-base-100 rounded-lg p-4">
                <div class="flex justify-between items-center mb-3">
                  <h3 class="font-bold text-lg">Raw Data (JSON)</h3>
                  <button @click="copyToClipboard" class="btn btn-sm btn-ghost gap-2">
                    <IconCopy class="w-4 h-4" />
                    Copy
                  </button>
                </div>
                <div class="overflow-x-auto">
                  <pre class="text-xs bg-base-200 p-4 rounded max-h-96 overflow-y-auto">{{ JSON.stringify(sanitizeForDisplay(fileData), null, 2) }}</pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import IconX from '~icons/lucide/x'
import IconUpload from '~icons/lucide/upload'
import IconTrash from '~icons/lucide/trash-2'
import IconCopy from '~icons/lucide/copy'
import IconInfo from '~icons/lucide/info'
import IconAlertCircle from '~icons/lucide/alert-circle'
import IconClipboard from '~icons/lucide/clipboard-copy'

const { knownWords } = useAnki()

const props = defineProps({
  modelValue: Boolean
})

const emit = defineEmits(['update:modelValue'])

const fileInput = ref(null)
const isDragging = ref(false)
const fileData = ref(null)
const activeView = ref('overview')

const hasStoredData = computed(() => knownWords.value.size > 0)

const closeModal = () => {
  emit('update:modelValue', false)
}

const triggerFileInput = () => {
  fileInput.value?.click()
}

const handleFileSelect = async (event) => {
  const file = event.target.files?.[0]
  if (file) {
    await processFile(file)
  }
}

const handleDrop = async (event) => {
  isDragging.value = false
  const file = event.dataTransfer.files?.[0]
  if (file && (file.name.endsWith('.apkg') || file.name.endsWith('.colpkg'))) {
    await processFile(file)
  }
}

const processFile = async (file) => {
  try {
    const JSZip = (await import('jszip')).default
    const zip = new JSZip()
    const contents = await zip.loadAsync(file)
    
    const files = []
    const fileNames = Object.keys(contents.files)
    
    for (const fileName of fileNames) {
      const fileObj = contents.files[fileName]
      if (!fileObj.dir) {
        files.push({
          name: fileName,
          size: fileObj._data?.uncompressedSize || 0
        })
      }
    }

    let collectionFile = contents.file('collection.anki21') || 
                         contents.file('collection.anki2')
    
    let dbData = null
    
    if (collectionFile) {
      const arrayBuffer = await collectionFile.async('arraybuffer')
      dbData = await parseDatabase(arrayBuffer)
    }

    const fileType = file.name.endsWith('.colpkg') ? 'Collection Package' : 'Deck Package'

    fileData.value = {
      fileName: file.name,
      fileSize: file.size,
      fileType,
      files,
      collectionFile: collectionFile?.name || null,
      ...dbData
    }
  } catch (error) {
    console.error('Error processing file:', error)
    alert('Error processing file: ' + error.message)
  }
}

const parseDatabase = async (arrayBuffer) => {
  try {
    const initSqlJs = (await import('sql.js')).default
    const SQL = await initSqlJs({
      locateFile: file => `https://sql.js.org/dist/${file}`
    })
    
    const db = new SQL.Database(new Uint8Array(arrayBuffer))
    
    const tablesResult = db.exec("SELECT name FROM sqlite_master WHERE type='table'")
    const tables = tablesResult[0]?.values.map(row => row[0]) || []
    
    let notes = []
    let cards = []
    let models = null
    let decks = null
    
    try {
      const notesResult = db.exec('SELECT * FROM notes LIMIT 1000')
      if (notesResult.length > 0) {
        const columns = notesResult[0].columns
        notes = notesResult[0].values.map(row => {
          const obj = {}
          columns.forEach((col, i) => {
            obj[col] = row[i]
          })
          return obj
        })
      }
    } catch (e) {
      console.error('Error loading notes:', e)
    }
    
    try {
      const cardsResult = db.exec('SELECT * FROM cards LIMIT 1000')
      if (cardsResult.length > 0) {
        const columns = cardsResult[0].columns
        cards = cardsResult[0].values.map(row => {
          const obj = {}
          columns.forEach((col, i) => {
            obj[col] = row[i]
          })
          return obj
        })
      }
    } catch (e) {
      console.error('Error loading cards:', e)
    }
    
    try {
      const colResult = db.exec('SELECT * FROM col')
      if (colResult.length > 0) {
        const modelsStr = colResult[0].values[0][9]
        const decksStr = colResult[0].values[0][10]
        
        if (modelsStr) {
          models = JSON.parse(modelsStr)
        }
        if (decksStr) {
          decks = JSON.parse(decksStr)
        }
      }
    } catch (e) {
      console.error('Error parsing col:', e)
    }
    
    const totalNotesResult = db.exec('SELECT COUNT(*) FROM notes')
    const totalCardsResult = db.exec('SELECT COUNT(*) FROM cards')
    
    const totalNotes = totalNotesResult[0]?.values[0][0] || 0
    const totalCards = totalCardsResult[0]?.values[0][0] || 0
    
    db.close()
    
    return {
      tables,
      notes,
      cards,
      models,
      decks,
      modelCount: models ? Object.keys(models).length : 0,
      totalNotes,
      totalCards
    }
  } catch (error) {
    console.error('Database parse error:', error)
    return {
      tables: [],
      notes: [],
      cards: [],
      models: null,
      decks: null,
      modelCount: 0,
      totalNotes: 0,
      totalCards: 0,
      error: error.message
    }
  }
}

const sanitizeForDisplay = (data) => {
  if (!data) return data
  const copy = JSON.parse(JSON.stringify(data))
  delete copy.notes
  delete copy.cards
  return copy
}

const getEssentialData = () => {
  if (!fileData.value) return null

  const essential = {
    summary: {
      fileName: fileData.value.fileName,
      totalNotes: fileData.value.totalNotes,
      totalCards: fileData.value.totalCards,
      modelCount: fileData.value.modelCount,
      tables: fileData.value.tables
    },
    models: {},
    sampleNotes: [],
    sampleCards: [],
    decks: fileData.value.decks
  }

  if (fileData.value.models) {
    for (const [key, model] of Object.entries(fileData.value.models)) {
      essential.models[key] = {
        id: model.id,
        name: model.name,
        type: model.type,
        fields: model.flds?.map(f => ({
          name: f.name,
          ord: f.ord
        })) || []
      }
    }
  }

  if (fileData.value.notes?.length) {
    essential.sampleNotes = fileData.value.notes.slice(0, 10).map(note => ({
      id: note.id,
      mid: note.mid,
      tags: note.tags,
      fields: note.flds?.split('\u001f') || [],
      mod: note.mod
    }))
  }

  if (fileData.value.cards?.length) {
    essential.sampleCards = fileData.value.cards.slice(0, 10).map(card => ({
      id: card.id,
      nid: card.nid,
      type: card.type,
      queue: card.queue,
      due: card.due,
      ivl: card.ivl,
      factor: card.factor,
      reps: card.reps,
      lapses: card.lapses
    }))
  }

  return essential
}

const copyEssentialData = async () => {
  try {
    const essential = getEssentialData()
    if (!essential) {
      alert('No data to copy')
      return
    }
    
    const formatted = JSON.stringify(essential, null, 2)
    await navigator.clipboard.writeText(formatted)
    alert('Essential data copied to clipboard!')
  } catch (err) {
    console.error('Failed to copy:', err)
    alert('Failed to copy data')
  }
}

const resetVisualizer = () => {
  fileData.value = null
  activeView.value = 'overview'
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

const formatBytes = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

const formatTime = (ms) => {
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  return `${minutes}m ${seconds % 60}s`
}

const getFileType = (name) => {
  if (name.includes('collection')) return 'Collection DB'
  if (name.endsWith('.db') || name.endsWith('.anki2') || name.endsWith('.anki21')) return 'Database'
  if (name === 'media') return 'Media Index'
  if (name.match(/\d+/)) return 'Media File'
  return 'Unknown'
}

const formatTimestamp = (timestamp) => {
  if (!timestamp) return '-'
  const date = new Date(timestamp * 1000)
  return date.toLocaleDateString()
}

const getCardType = (type) => {
  const types = {
    0: 'New',
    1: 'Learning',
    2: 'Review',
    3: 'Relearning'
  }
  return types[type] || 'Unknown'
}

const getQueueType = (queue) => {
  const queues = {
    '-3': 'Buried',
    '-2': 'Buried',
    '-1': 'Suspended',
    '0': 'New',
    '1': 'Learning',
    '2': 'Review',
    '3': 'Learning',
    '4': 'Preview'
  }
  return queues[queue.toString()] || 'Unknown'
}

const copyToClipboard = async () => {
  try {
    await navigator.clipboard.writeText(JSON.stringify(sanitizeForDisplay(fileData.value), null, 2))
    alert('Copied to clipboard!')
  } catch (err) {
    console.error('Failed to copy:', err)
  }
}

watch(() => props.modelValue, (newVal) => {
  if (newVal && hasStoredData.value && !fileData.value) {
    loadStoredData()
  }
})

const loadStoredData = () => {
  const words = Array.from(knownWords.value.values())
  
  fileData.value = {
    fileName: 'Stored Anki Data',
    fileSize: 0,
    fileType: 'Local Storage',
    files: [],
    collectionFile: null,
    tables: [],
    notes: words.map((word, idx) => ({
      id: idx,
      mid: 0,
      tags: word.tags?.join(' ') || '',
      flds: `${word.word}\u001f${word.meaning}\u001f${word.reading}`,
      mod: Date.now() / 1000
    })),
    cards: words.map((word, idx) => ({
      id: idx,
      nid: idx,
      type: 2,
      queue: 2,
      due: 0,
      ivl: word.interval || 0,
      factor: 2500,
      reps: word.reviews || 0,
      lapses: word.lapses || 0
    })),
    models: {
      '0': {
        id: 0,
        name: 'Japanese-Core',
        type: 0,
        flds: [
          { name: 'Expression', ord: 0 },
          { name: 'Meaning', ord: 1 },
          { name: 'Reading', ord: 2 }
        ]
      }
    },
    decks: null,
    modelCount: 1,
    totalNotes: words.length,
    totalCards: words.length
  }
}

onMounted(() => {
  if (props.modelValue && hasStoredData.value) {
    loadStoredData()
  }
})
</script>