import type { SupabaseClient } from '@supabase/supabase-js'
import { memberId } from '../../publishedLanguage/memberId.ts'
import type { MissionPlan } from '../../publishedLanguage/missionPlan.ts'
import { parseLocalDate } from '../../shared/LocalDate.ts'
import type { TeamNumber } from '../domain/Team.ts'
import { TeamMission } from '../domain/TeamMission.ts'
import type { TeamMissionRepository, TeamMissionState } from '../domain/TeamMissionRepository.ts'

const ROW_ID = 1
/** Postgres のユニーク制約違反のエラーコード。 */
const UNIQUE_VIOLATION = '23505'

interface StoredMission {
  id: string
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

interface StoredState {
  missions: StoredMission[]
}

/**
 * `team_mission_state` テーブル（単一行。ARCHITECTURE.md「データ永続化（DB）設計」）。
 * `version` 列で楽観的ロックをかける（ARCHITECTURE.md「`tick()` の実行方式」）。
 */
export class SupabaseTeamMissionRepository implements TeamMissionRepository {
  private readonly client: SupabaseClient

  constructor(client: SupabaseClient) {
    this.client = client
  }

  async load(): Promise<{ state: TeamMissionState; version: number }> {
    const { data, error } = await this.client
      .from('team_mission_state')
      .select('state, version')
      .eq('id', ROW_ID)
      .maybeSingle()
    if (error) throw error
    if (!data) return { state: { missions: [] }, version: 0 }
    return { state: fromStoredState(data.state as StoredState), version: data.version }
  }

  async save(state: TeamMissionState, version: number): Promise<boolean> {
    const stored = toStoredState(state)
    if (version === 0) {
      const { error } = await this.client
        .from('team_mission_state')
        .insert({ id: ROW_ID, state: stored, version: 1 })
      if (error) {
        if (error.code === UNIQUE_VIOLATION) return false
        throw error
      }
      return true
    }
    const { data, error } = await this.client
      .from('team_mission_state')
      .update({ state: stored, version: version + 1, updated_at: new Date().toISOString() })
      .eq('id', ROW_ID)
      .eq('version', version)
      .select('id')
    if (error) throw error
    return (data?.length ?? 0) > 0
  }
}

function fromStoredState(stored: StoredState): TeamMissionState {
  return {
    missions: stored.missions.map((m) =>
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

function toStoredState(state: TeamMissionState): StoredState {
  return {
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
  }
}
