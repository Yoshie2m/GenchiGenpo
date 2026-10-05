import type { SupabaseClient } from '@supabase/supabase-js'
import { memberId as toMemberId, type MemberId } from '../../publishedLanguage/memberId.ts'
import { parseLocalDate } from '../../shared/LocalDate.ts'
import { PersonalMission } from '../domain/PersonalMission.ts'
import type { PersonalMissionRepository } from '../domain/PersonalMissionRepository.ts'
import type { Route } from '../domain/Route.ts'

/**
 * `personal_missions`・`personal_mission_steps`・`personal_mission_arrivals` テーブル
 * （ARCHITECTURE.md「データ永続化（DB）設計」）。ルートは固定（マスターデータ）なので保存しない。
 */
export class SupabasePersonalMissionRepository implements PersonalMissionRepository {
  private readonly client: SupabaseClient
  private readonly route: Route

  constructor(client: SupabaseClient, route: Route) {
    this.client = client
    this.route = route
  }

  async findByMember(memberId: MemberId): Promise<PersonalMission | null> {
    const { data: missionRow, error: missionError } = await this.client
      .from('personal_missions')
      .select('member_id, start_date')
      .eq('member_id', memberId)
      .maybeSingle()
    if (missionError) throw missionError
    if (!missionRow) return null

    const [stepsResult, arrivalsResult] = await Promise.all([
      this.client.from('personal_mission_steps').select('date, steps').eq('member_id', memberId),
      this.client
        .from('personal_mission_arrivals')
        .select('checkpoint_index, arrived_at')
        .eq('member_id', memberId),
    ])
    if (stepsResult.error) throw stepsResult.error
    if (arrivalsResult.error) throw arrivalsResult.error

    return PersonalMission.fromSnapshot(
      {
        memberId: toMemberId(missionRow.member_id),
        startDate: parseLocalDate(missionRow.start_date),
        stepsByDate: stepsResult.data.map(
          (r: { date: string; steps: number }) => [parseLocalDate(r.date), r.steps] as const,
        ),
        arrivals: arrivalsResult.data.map(
          (r: { checkpoint_index: number; arrived_at: string }) => ({
            checkpointIndex: r.checkpoint_index,
            arrivedAt: new Date(r.arrived_at),
          }),
        ),
      },
      this.route,
    )
  }

  async save(mission: PersonalMission): Promise<void> {
    const s = mission.toSnapshot()
    const { error: missionError } = await this.client
      .from('personal_missions')
      .upsert({ member_id: s.memberId, start_date: s.startDate })
    if (missionError) throw missionError

    if (s.stepsByDate.length > 0) {
      const { error } = await this.client
        .from('personal_mission_steps')
        .upsert(s.stepsByDate.map(([date, steps]) => ({ member_id: s.memberId, date, steps })))
      if (error) throw error
    }

    if (s.arrivals.length > 0) {
      const { error } = await this.client.from('personal_mission_arrivals').upsert(
        s.arrivals.map((a) => ({
          member_id: s.memberId,
          checkpoint_index: a.checkpointIndex,
          arrived_at: a.arrivedAt.toISOString(),
        })),
      )
      if (error) throw error
    }
  }
}
