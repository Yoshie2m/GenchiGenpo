import { memberId } from '../../publishedLanguage/memberId.ts'
import { parseLocalDate } from '../../shared/LocalDate.ts'
import { VersionedStorage, type KeyValueStorage } from '../../shared/VersionedStorage.ts'
import { PersonalMission } from '../domain/PersonalMission.ts'
import type { PersonalMissionRepository } from '../domain/PersonalMissionRepository.ts'
import type { Route } from '../domain/Route.ts'

export const PERSONAL_MISSION_STORAGE_KEY = 'genchigenpo:personalMission'
const VERSION = 1

interface Stored {
  missions: {
    memberId: string
    startDate: string
    stepsByDate: [string, number][]
    arrivals: { checkpointIndex: number; arrivedAt: string }[]
  }[]
}

/** 個人ミッションを保存する。ルートは固定（マスターデータ）なので保存しない。 */
export class LocalStoragePersonalMissionRepository implements PersonalMissionRepository {
  private readonly storage: VersionedStorage<Stored>
  private readonly route: Route

  constructor(storage: KeyValueStorage, route: Route) {
    this.storage = new VersionedStorage<Stored>(storage, PERSONAL_MISSION_STORAGE_KEY, VERSION)
    this.route = route
  }

  load(): PersonalMission[] {
    return (this.storage.load()?.missions ?? []).map((m) =>
      PersonalMission.fromSnapshot(
        {
          memberId: memberId(m.memberId),
          startDate: parseLocalDate(m.startDate),
          stepsByDate: m.stepsByDate.map(([d, s]) => [parseLocalDate(d), s] as const),
          arrivals: m.arrivals.map((a) => ({
            checkpointIndex: a.checkpointIndex,
            arrivedAt: new Date(a.arrivedAt),
          })),
        },
        this.route,
      ),
    )
  }

  save(missions: readonly PersonalMission[]): void {
    this.storage.save({
      missions: missions.map((mission) => {
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
      }),
    })
  }
}
