// Utility to store File System Access API handles in IndexedDB
// File handles can be stored in IndexedDB for persistence

const DB_NAME = 'japanese-reader-files'
const DB_VERSION = 1
const STORE_NAME = 'fileHandles'

let db: IDBDatabase | null = null

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (db) {
      resolve(db)
      return
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => {
      db = request.result
      resolve(db)
    }

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME)
      }
    }
  })
}

export const saveFileHandle = async (bookId: string, handle: FileSystemFileHandle): Promise<void> => {
  try {
    const database = await openDB()
    const transaction = database.transaction([STORE_NAME], 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    await store.put(handle, bookId)
  } catch (error) {
    console.error('Error saving file handle:', error)
  }
}

export const getFileHandle = async (bookId: string): Promise<FileSystemFileHandle | null> => {
  try {
    const database = await openDB()
    const transaction = database.transaction([STORE_NAME], 'readonly')
    const store = transaction.objectStore(STORE_NAME)
    return new Promise((resolve, reject) => {
      const request = store.get(bookId)
      request.onsuccess = () => resolve(request.result || null)
      request.onerror = () => reject(request.error)
    })
  } catch (error) {
    console.error('Error getting file handle:', error)
    return null
  }
}

export const removeFileHandle = async (bookId: string): Promise<void> => {
  try {
    const database = await openDB()
    const transaction = database.transaction([STORE_NAME], 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    await store.delete(bookId)
  } catch (error) {
    console.error('Error removing file handle:', error)
  }
}

export const generateBookId = (fileName: string, title: string): string => {
  return `${fileName}-${title}-${Date.now()}`
}

