import { memberId } from '../../publishedLanguage/memberId.ts'
import { parseLocalDate } from '../../shared/LocalDate.ts'
import { VersionedStorage, type KeyValueStorage } from '../../shared/VersionedStorage.ts'
import { DailySteps, type StepSource } from '../domain/DailySteps.ts'
import type { DailyStepsRepository } from '../domain/DailyStepsRepository.ts'

export const STEP_RECORD_STORAGE_KEY = 'genchigenpo:stepRecord'
const VERSION = 1

interface Stored {
  records: {
    memberId: string
    date: string
    steps: number
    source: StepSource
    reflectedAt: string
  }[]
}

/** 歩数記録コンテキストの状態を、localStorage の1つのキーにまとめて保存する。 */
export class LocalStorageDailyStepsRepository implements DailyStepsRepository {
  private readonly storage: VersionedStorage<Stored>

  constructor(storage: KeyValueStorage) {
    this.storage = new VersionedStorage<Stored>(storage, STEP_RECORD_STORAGE_KEY, VERSION)
  }

  async load(): Promise<DailySteps[]> {
    return (this.storage.load()?.records ?? []).map((r) =>
      DailySteps.reconstruct(
        memberId(r.memberId),
        parseLocalDate(r.date),
        r.steps,
        r.source,
        new Date(r.reflectedAt),
      ),
    )
  }

  async save(records: readonly DailySteps[]): Promise<void> {
    this.storage.save({
      records: records.map((r) => ({
        memberId: r.memberId,
        date: r.date,
        steps: r.steps,
        source: r.source,
        reflectedAt: r.reflectedAt.toISOString(),
      })),
    })
  }
}
