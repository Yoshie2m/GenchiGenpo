import { memberId } from '../../publishedLanguage/memberId.ts'
import type { MissionPlan } from '../../publishedLanguage/missionPlan.ts'
import { parseLocalDate } from '../../shared/LocalDate.ts'
import { VersionedStorage, type KeyValueStorage } from '../../shared/VersionedStorage.ts'
import type { TeamNumber } from '../domain/Team.ts'
import { TeamMission } from '../domain/TeamMission.ts'
import type { TeamMissionRepository, TeamMissionState } from '../domain/TeamMissionRepository.ts'

export const TEAM_MISSION_STORAGE_KEY = 'genchigenpo:teamMission'
const VERSION = 1

interface StoredMission {
  id: string
  /** 作成時に写し取った候補の内容（その後に候補が変わってもミッションは変わらない）。 */
  plan: MissionPlan
  startDate: string
  teams: {
    number: TeamNumber
    members: string[]
    steps: [string, string, number][]
    waypointArrivals: [number, string][]
  }[]
  finalDay: string | null
  firstArrivedTeam: TeamNumber | null
}

interface Stored {
  missions: StoredMission[]
}

/** チームミッションコンテキストの状態を、localStorage の1つのキーにまとめて保存する。 */
export class LocalStorageTeamMissionRepository implements TeamMissionRepository {
  private readonly storage: VersionedStorage<Stored>

  constructor(storage: KeyValueStorage) {
    this.storage = new VersionedStorage<Stored>(storage, TEAM_MISSION_STORAGE_KEY, VERSION)
  }

  load(): TeamMissionState {
    return {
      missions: (this.storage.load()?.missions ?? []).map((m) =>
        TeamMission.fromSnapshot({
          id: m.id,
          plan: m.plan,
          startDate: parseLocalDate(m.startDate),
          teams: m.teams.map((t) => ({
            number: t.number,
            members: t.members.map(memberId),
            steps: t.steps.map(([mid, d, s]) => [memberId(mid), parseLocalDate(d), s] as const),
            waypointArrivals: t.waypointArrivals.map(([i, at]) => [i, new Date(at)] as const),
          })),
          finalDay: m.finalDay === null ? null : parseLocalDate(m.finalDay),
          firstArrivedTeam: m.firstArrivedTeam,
        }),
      ),
    }
  }

  save(state: TeamMissionState): void {
    this.storage.save({
      missions: state.missions.map((mission) => {
        const s = mission.toSnapshot()
        return {
          id: s.id,
          plan: s.plan,
          startDate: s.startDate,
          teams: s.teams.map((t) => ({
            number: t.number,
            members: [...t.members],
            steps: t.steps.map(([m, d, steps]) => [m, d, steps]),
            waypointArrivals: t.waypointArrivals.map(([i, at]) => [i, at.toISOString()]),
          })),
          finalDay: s.finalDay,
          firstArrivedTeam: s.firstArrivedTeam,
        }
      }),
    })
  }
}
