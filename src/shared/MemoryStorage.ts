import type { KeyValueStorage } from './VersionedStorage.ts'

/**
 * ブラウザの localStorage を使わず、メモリの中だけに保存する入れ物（Storage の代わり）。
 * ページを閉じると消える。サンプルページが、実際のメンバーの保存データと混ざらないために使う。
 */
export class MemoryStorage implements KeyValueStorage {
  private readonly items = new Map<string, string>()

  get length(): number {
    return this.items.size
  }

  key(index: number): string | null {
    return [...this.items.keys()][index] ?? null
  }

  getItem(key: string): string | null {
    return this.items.get(key) ?? null
  }

  setItem(key: string, value: string): void {
    this.items.set(key, value)
  }

  removeItem(key: string): void {
    this.items.delete(key)
  }
}
