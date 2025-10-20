import 'pinia'

declare module 'pinia' {
  export interface DefineStoreOptionsBase<S, Store> {
    persist?: boolean | {
      key?: string
      storage?: Storage
      paths?: (keyof S)[]
      beforeRestore?: (context: { store: Store }) => void
      afterRestore?: (context: { store: Store }) => void
    }
  }
}