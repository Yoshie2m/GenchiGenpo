import type { Clock } from './Clock.ts'
import type { KeyValueStorage } from './VersionedStorage.ts'

const DAY_MS = 24 * 60 * 60 * 1000

/**
 * 開発用の時計。本物の時刻に「進めた分」を足して返す（PoC の「日付を進める」で使う）。
 * 進めた分は保存しておき、画面を開き直しても同じ日付から続けられる。
 */
export class AdjustableClock implements Clock {
  private readonly base: Clock
  private readonly storage: KeyValueStorage
  private readonly key: string

  constructor(base: Clock, storage: KeyValueStorage, key = 'genchigenpo:devClockOffset') {
    this.base = base
    this.storage = storage
    this.key = key
  }

  now(): Date {
    return new Date(this.base.now().getTime() + this.offsetMs)
  }

  /** 進めた時間（ミリ秒）。 */
  get offsetMs(): number {
    const raw = this.storage.getItem(this.key)
    const value = raw === null ? 0 : Number(raw)
    return Number.isFinite(value) ? value : 0
  }

  advance(ms: number): void {
    this.storage.setItem(this.key, String(this.offsetMs + ms))
  }

  advanceDays(days: number): void {
    this.advance(days * DAY_MS)
  }

  /** 本物の時刻に戻す。 */
  reset(): void {
    this.storage.removeItem(this.key)
  }
}
