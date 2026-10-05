import type { MissionPlan } from '../../publishedLanguage/missionPlan.ts'
import { VersionedStorage, type KeyValueStorage } from '../../shared/VersionedStorage.ts'
import { CandidateList } from '../domain/CandidateList.ts'
import type { CandidateListRepository } from '../domain/CandidateListRepository.ts'

export const MISSION_CANDIDATE_STORAGE_KEY = 'genchigenpo:missionCandidate'
const VERSION = 1

interface Stored {
  /** 候補 ID の並び順。 */
  order: string[]
}

export class LocalStorageCandidateListRepository implements CandidateListRepository {
  private readonly storage: VersionedStorage<Stored>

  constructor(storage: KeyValueStorage) {
    this.storage = new VersionedStorage<Stored>(storage, MISSION_CANDIDATE_STORAGE_KEY, VERSION)
  }

  /**
   * 保存した並び順で候補を並べる。マスターデータに新しく増えた候補は末尾に足し、
   * なくなった候補は外す（マスターデータの中身が正）。
   */
  async load(master: readonly MissionPlan[]): Promise<CandidateList> {
    const order = this.storage.load()?.order ?? []
    const byId = new Map(master.map((p) => [p.candidateId, p]))
    const known = order.flatMap((id) => byId.get(id) ?? [])
    const added = master.filter((p) => !order.includes(p.candidateId))
    return CandidateList.of([...known, ...added])
  }

  async save(list: CandidateList): Promise<void> {
    this.storage.save({ order: list.candidates.map((c) => c.candidateId) })
  }
}
