import type { MemberId } from '../../publishedLanguage/memberId.ts'
import { memberId as toMemberId } from '../../publishedLanguage/memberId.ts'
import { parseLocalDate } from '../../shared/LocalDate.ts'
import { VersionedStorage, type KeyValueStorage } from '../../shared/VersionedStorage.ts'
import { PersonalMission } from '../domain/PersonalMission.ts'
import type { PersonalMissionRepository } from '../domain/PersonalMissionRepository.ts'
import type { Route } from '../domain/Route.ts'

export const PERSONAL_MISSION_STORAGE_KEY = 'genchigenpo:personalMission'
const VERSION = 1

interface StoredMission {
  memberId: string
  startDate: string
  stepsByDate: [string, number][]
  arrivals: { checkpointIndex: number; arrivedAt: string }[]
}

interface Stored {
  missions: StoredMission[]
}

/**
 * 全員分を1つのキーにまとめて保存する（1人分の読み書きも、内部では全員分を読み直し・書き戻す）。
 * ルートは固定（マスターデータ）なので保存しない。
 */
export class LocalStoragePersonalMissionRepository implements PersonalMissionRepository {
  private readonly storage: VersionedStorage<Stored>
  private readonly route: Route

  constructor(storage: KeyValueStorage, route: Route) {
    this.storage = new VersionedStorage<Stored>(storage, PERSONAL_MISSION_STORAGE_KEY, VERSION)
    this.route = route
  }

  async findByMember(memberId: MemberId): Promise<PersonalMission | null> {
    const stored = (this.storage.load()?.missions ?? []).find((m) => m.memberId === memberId)
    return stored ? this.toDomain(stored) : null
  }

  async save(mission: PersonalMission): Promise<void> {
    const missions = this.storage.load()?.missions ?? []
    const index = missions.findIndex((m) => m.memberId === mission.memberId)
    const stored = this.toStored(mission)
    if (index >= 0) missions[index] = stored
    else missions.push(stored)
    this.storage.save({ missions })
  }

  private toDomain(stored: StoredMission): PersonalMission {
    return PersonalMission.fromSnapshot(
      {
        memberId: toMemberId(stored.memberId),
        startDate: parseLocalDate(stored.startDate),
        stepsByDate: stored.stepsByDate.map(([d, s]) => [parseLocalDate(d), s] as const),
        arrivals: stored.arrivals.map((a) => ({
          checkpointIndex: a.checkpointIndex,
          arrivedAt: new Date(a.arrivedAt),
        })),
      },
      this.route,
    )
  }

  private toStored(mission: PersonalMission): StoredMission {
    const s = mission.toSnapshot()
    return {
      memberId: s.memberId,
      startDate: s.startDate,
      stepsByDate: s.stepsByDate.map(([d, steps]) => [d, steps]),
      arrivals: s.arrivals.map((a) => ({
        checkpointIndex: a.checkpointIndex,
        arrivedAt: a.arrivedAt.toISOString(),
      })),
    }
  }
}
