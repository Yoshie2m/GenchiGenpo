import type { MemberId } from '../../publishedLanguage/memberId.ts'
import { memberId as toMemberId } from '../../publishedLanguage/memberId.ts'
import type { LocalDate } from '../../shared/LocalDate.ts'
import { parseLocalDate } from '../../shared/LocalDate.ts'
import { VersionedStorage, type KeyValueStorage } from '../../shared/VersionedStorage.ts'
import { DailySteps, type StepSource } from '../domain/DailySteps.ts'
import type { DailyStepsRepository } from '../domain/DailyStepsRepository.ts'

export const STEP_RECORD_STORAGE_KEY = 'genchigenpo:stepRecord'
const VERSION = 1

interface StoredRecord {
  memberId: string
  date: string
  steps: number
  source: StepSource
  reflectedAt: string
}

interface Stored {
  records: StoredRecord[]
}

/** 全件を1つのキーにまとめて保存する（1件の読み書きも、内部では全件を読み直し・書き戻す）。 */
export class LocalStorageDailyStepsRepository implements DailyStepsRepository {
  private readonly storage: VersionedStorage<Stored>

  constructor(storage: KeyValueStorage) {
    this.storage = new VersionedStorage<Stored>(storage, STEP_RECORD_STORAGE_KEY, VERSION)
  }

  async findOne(memberId: MemberId, date: LocalDate): Promise<DailySteps | null> {
    const stored = (this.storage.load()?.records ?? []).find(
      (r) => r.memberId === memberId && r.date === date,
    )
    return stored ? toDomain(stored) : null
  }

  async save(record: DailySteps, guard: boolean): Promise<void> {
    const records = this.storage.load()?.records ?? []
    const index = records.findIndex((r) => r.memberId === record.memberId && r.date === record.date)
    if (index >= 0 && guard && records[index].steps > record.steps) return
    const stored = toStored(record)
    if (index >= 0) records[index] = stored
    else records.push(stored)
    this.storage.save({ records })
  }

  async findByMember(
    memberId: MemberId,
    range?: { readonly from: LocalDate; readonly until: LocalDate },
  ): Promise<DailySteps[]> {
    return (this.storage.load()?.records ?? [])
      .filter(
        (r) =>
          r.memberId === memberId && (!range || (r.date >= range.from && r.date <= range.until)),
      )
      .map(toDomain)
  }

  async findByDate(date: LocalDate): Promise<DailySteps[]> {
    return (this.storage.load()?.records ?? []).filter((r) => r.date === date).map(toDomain)
  }
}

function toDomain(stored: StoredRecord): DailySteps {
  return DailySteps.reconstruct(
    toMemberId(stored.memberId),
    parseLocalDate(stored.date),
    stored.steps,
    stored.source,
    new Date(stored.reflectedAt),
  )
}

function toStored(record: DailySteps): StoredRecord {
  return {
    memberId: record.memberId,
    date: record.date,
    steps: record.steps,
    source: record.source,
    reflectedAt: record.reflectedAt.toISOString(),
  }
}
