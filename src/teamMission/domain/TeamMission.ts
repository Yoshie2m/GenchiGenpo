import type { MemberId } from '../../publishedLanguage/memberId.ts'
import type { MissionPlan } from '../../publishedLanguage/missionPlan.ts'
import type { StepsRecorded } from '../../publishedLanguage/stepRecordEvents.ts'
import { DomainError } from '../../shared/DomainError.ts'
import { addDays, atJst, localDateOf, type LocalDate } from '../../shared/LocalDate.ts'
import { competitionRanks } from '../../shared/ranking.ts'
import { datesFrom, evaluationSteps, progressSteps, type DayStepsOfTeam } from './scoring.ts'
import { teamNumbers, type TeamAssignment, type TeamNumber } from './Team.ts'
import { waypointResult, type WaypointResult } from './waypointPoints.ts'

/** 最終日の歩数を受け付ける期限は、最終日の翌日のこの時刻（日本時間）。 */
export const STEP_DEADLINE_HOUR = 13

/**
 * ミッションの状態。
 * - notStarted: 開始日の 0:00 より前
 * - inProgress: 進行中（中間地点の通過・到達を判定する）
 * - accepting: 最終日が終わり、歩数受付締切（翌日 13:00）までは歩数を受け付ける
 * - finalized: 歩数受付締切を過ぎ、最終順位が確定した
 */
export type MissionStatus = 'notStarted' | 'inProgress' | 'accepting' | 'finalized'

export interface TeamStanding {
  readonly team: TeamNumber
  readonly progressSteps: number
  readonly evaluationSteps: number
  /** 中間通過ポイントの合計。 */
  readonly points: number
  /** 最終評価歩数 = チーム評価歩数 + 中間通過ポイント。 */
  readonly finalScore: number
  readonly rank: number
}

export interface WaypointStanding extends WaypointResult {
  readonly waypointIndex: number
  readonly arrivedAt: Date
}

/** 保存・復元に使う形（ドメインの外へ渡すただのデータ）。 */
export interface TeamMissionSnapshot {
  readonly id: string
  readonly plan: MissionPlan
  readonly startDate: LocalDate
  readonly teams: readonly {
    readonly number: TeamNumber
    readonly members: readonly MemberId[]
    /** [メンバー, 日付, 歩数] */
    readonly steps: readonly (readonly [MemberId, LocalDate, number])[]
    /** [中間地点の番号, 到着時刻] */
    readonly waypointArrivals: readonly (readonly [number, Date])[]
  }[]
  readonly finalDay: LocalDate | null
  readonly firstArrivedTeam: TeamNumber | null
}

interface TeamState {
  readonly number: TeamNumber
  readonly members: Set<MemberId>
  /** `${memberId}|${date}` → その日の歩数。 */
  readonly steps: Map<string, number>
  /** 中間地点の番号 → 到着時刻（反映日時）。一度決まった記録は消さない。 */
  readonly waypointArrivals: Map<number, Date>
}

/**
 * チームミッション集約（DOMAINS.md 3章）。ミッション・チーム・目的地をひとまとめに扱う。
 * 歩数記録の「歩数が記録された」を受け取り、隊ごとの歩数を持って、中間地点・到達・順位を判定する。
 */
export class TeamMission {
  readonly id: string
  readonly plan: MissionPlan
  readonly startDate: LocalDate
  /** 期限（期間の最終日）。どの隊も到達しなければ、この日が最終日になる。 */
  readonly endDate: LocalDate
  private readonly teams: TeamState[]
  private finalDayValue: LocalDate | null = null
  private firstArrivedTeamValue: TeamNumber | null = null

  private constructor(id: string, plan: MissionPlan, startDate: LocalDate, teams: TeamState[]) {
    this.id = id
    this.plan = plan
    this.startDate = startDate
    this.endDate = addDays(startDate, plan.periodDays - 1)
    this.teams = teams
  }

  static start(
    id: string,
    plan: MissionPlan,
    startDate: LocalDate,
    teamCount: number,
    assignments: readonly TeamAssignment[],
  ): TeamMission {
    if (plan.periodDays < 1) throw new DomainError('期間は1日以上です')
    const teams = teamNumbers(teamCount).map((number) => ({
      number,
      members: new Set<MemberId>(),
      steps: new Map<string, number>(),
      waypointArrivals: new Map<number, Date>(),
    }))
    const mission = new TeamMission(id, plan, startDate, teams)
    for (const a of assignments) mission.addMember(a.memberId, a.team)
    return mission
  }

  /** 保存したデータから復元する。 */
  static fromSnapshot(snapshot: TeamMissionSnapshot): TeamMission {
    const teams = snapshot.teams.map((t) => ({
      number: t.number,
      members: new Set(t.members),
      steps: new Map(t.steps.map(([m, d, s]) => [`${m}|${d}`, s] as const)),
      waypointArrivals: new Map(t.waypointArrivals),
    }))
    const mission = new TeamMission(snapshot.id, snapshot.plan, snapshot.startDate, teams)
    mission.finalDayValue = snapshot.finalDay
    mission.firstArrivedTeamValue = snapshot.firstArrivedTeam
    return mission
  }

  toSnapshot(): TeamMissionSnapshot {
    return {
      id: this.id,
      plan: this.plan,
      startDate: this.startDate,
      teams: this.teams.map((t) => ({
        number: t.number,
        members: [...t.members],
        steps: [...t.steps.entries()].map(([key, s]) => {
          const [m, d] = key.split('|')
          return [m as MemberId, d as LocalDate, s] as const
        }),
        waypointArrivals: [...t.waypointArrivals.entries()],
      })),
      finalDay: this.finalDayValue,
      firstArrivedTeam: this.firstArrivedTeamValue,
    }
  }

  /** メンバーを隊に入れる（開始時の振り分け・途中参加）。1つのミッションで1つの隊だけ。 */
  addMember(memberId: MemberId, team: TeamNumber): void {
    if (this.teamOf(memberId) !== null) {
      throw new DomainError(`すでに隊に所属しています（チーム移動は認めない）: ${memberId}`)
    }
    const target = this.teams.find((t) => t.number === team)
    if (!target) throw new DomainError(`この隊はありません: ${team}`)
    target.members.add(memberId)
  }

  teamOf(memberId: MemberId): TeamNumber | null {
    return this.teams.find((t) => t.members.has(memberId))?.number ?? null
  }

  membersOf(team: TeamNumber): MemberId[] {
    return [...(this.teams.find((t) => t.number === team)?.members ?? [])]
  }

  get teamCount(): number {
    return this.teams.length
  }

  /** 最終日。最初の1隊が到達した日（反映日時の日）。まだ到達がなければ null。 */
  get finalDay(): LocalDate | null {
    return this.finalDayValue
  }

  /** 最初に到達した隊（表示用）。 */
  get firstArrivedTeam(): TeamNumber | null {
    return this.firstArrivedTeamValue
  }

  /** 今の時点で最後の日（到達していれば最終日、していなければ期限）。 */
  get lastDay(): LocalDate {
    return this.finalDayValue ?? this.endDate
  }

  /** ミッションが終わる時刻（最後の日の 23:59:59 が過ぎた時点）。 */
  get endsAt(): Date {
    return atJst(addDays(this.lastDay, 1))
  }

  /** 歩数受付締切（最終日の翌日 13:00）。この時点で最終順位が確定する。 */
  get stepDeadline(): Date {
    return atJst(addDays(this.lastDay, 1), STEP_DEADLINE_HOUR)
  }

  status(now: Date): MissionStatus {
    if (now < atJst(this.startDate)) return 'notStarted'
    if (now < this.endsAt) return 'inProgress'
    if (now < this.stepDeadline) return 'accepting'
    return 'finalized'
  }

  /**
   * 歩数が記録されたときに呼ぶ。
   * - この隊のメンバーで、日付が開始日〜最後の日の歩数だけを数える。
   * - 歩数受付締切を過ぎて反映された歩数は数えない。
   * - 中間地点の通過・到達は、ミッションが終わる（最後の日の 23:59:59）までに反映された歩数で判定する。
   *   一度決まった判定は、誤入力の修正で歩数が減っても残す。
   */
  recordSteps(event: StepsRecorded): void {
    const team = this.teams.find((t) => t.members.has(event.memberId))
    if (!team) return
    if (event.date < this.startDate || event.date > this.lastDay) return
    if (event.reflectedAt >= this.stepDeadline) return
    team.steps.set(`${event.memberId}|${event.date}`, event.steps)
    if (event.reflectedAt >= this.endsAt) return
    this.judge(team, event.reflectedAt)
  }

  private judge(team: TeamState, reflectedAt: Date): void {
    const progress = this.progressOf(team)
    this.plan.waypoints.forEach((wp, index) => {
      if (!team.waypointArrivals.has(index) && progress >= wp.progressSteps) {
        team.waypointArrivals.set(index, reflectedAt)
      }
    })
    if (this.finalDayValue === null && progress >= this.plan.targetSteps) {
      this.finalDayValue = localDateOf(reflectedAt)
      this.firstArrivedTeamValue = team.number
    }
  }

  private stepsOfDay(team: TeamState): (date: LocalDate) => DayStepsOfTeam {
    return (date) => {
      const result: number[] = []
      for (const m of team.members) {
        const s = team.steps.get(`${m}|${date}`)
        if (s !== undefined) result.push(s)
      }
      return result
    }
  }

  private progressOf(team: TeamState): number {
    return progressSteps(this.stepsOfDay(team), datesFrom(this.startDate, this.lastDay))
  }

  /**
   * その日に、隊の中で歩数が上位2名に入っているメンバー（「今日の上位に入っています」の表示に使う）。
   * 歩数が同じで3人以上並んだときは、先に並んだ順で2名。
   */
  topTwoMembersOn(team: TeamNumber, date: LocalDate): MemberId[] {
    const state = this.stateOf(team)
    return [...state.members]
      .flatMap((m) => {
        const s = state.steps.get(`${m}|${date}`)
        return s === undefined ? [] : [{ m, s }]
      })
      .sort((a, b) => b.s - a.s)
      .slice(0, 2)
      .map((x) => x.m)
  }

  /** 中間地点ごとの着順と中間通過ポイント（着いた中間地点だけ）。 */
  waypointStandings(team: TeamNumber): WaypointStanding[] {
    const state = this.stateOf(team)
    return [...state.waypointArrivals.entries()]
      .sort(([a], [b]) => a - b)
      .map(([index, arrivedAt]) => {
        const others = this.teams
          .filter((t) => t !== state)
          .flatMap((t) => t.waypointArrivals.get(index) ?? [])
        return {
          waypointIndex: index,
          arrivedAt,
          ...waypointResult(this.plan.waypoints[index], arrivedAt, others),
        }
      })
  }

  /**
   * 隊ごとの進行歩数・チーム評価歩数・中間通過ポイント・最終評価歩数・順位。
   * チーム評価歩数は開始日から、最後の日と今日の早いほうまで（まだ来ていない日は数えない）。
   * 最終順位は歩数受付締切の時点で確定する（status が finalized）。
   */
  standings(now: Date): TeamStanding[] {
    const today = localDateOf(now)
    const until = today < this.lastDay ? today : this.lastDay
    const rows = this.teams.map((t) => {
      const evaluation = evaluationSteps(this.stepsOfDay(t), datesFrom(this.startDate, until))
      const points = this.waypointStandings(t.number).reduce((sum, w) => sum + w.points, 0)
      return {
        team: t.number,
        progressSteps: this.progressOf(t),
        evaluationSteps: evaluation,
        points,
        finalScore: evaluation + points,
      }
    })
    const ranks = competitionRanks(rows.map((r) => r.finalScore))
    return rows.map((r, i) => ({ ...r, rank: ranks[i] }))
  }

  /** 優勝チーム（最終順位で1位の隊。同率なら全隊）。順位が確定するまでは空。 */
  winners(now: Date): TeamNumber[] {
    if (this.status(now) !== 'finalized') return []
    return this.standings(now)
      .filter((s) => s.rank === 1)
      .map((s) => s.team)
  }

  private stateOf(team: TeamNumber): TeamState {
    const state = this.teams.find((t) => t.number === team)
    if (!state) throw new DomainError(`この隊はありません: ${team}`)
    return state
  }
}
