import type { MemberId } from '../../publishedLanguage/memberId.ts'
import type { MissionPlan, WaypointPlan } from '../../publishedLanguage/missionPlan.ts'
import type {
  MemberDirectory,
  MissionCandidateCatalog,
  StepHistory,
} from '../../publishedLanguage/queries.ts'
import type { StepsRecorded } from '../../publishedLanguage/stepRecordEvents.ts'
import type { Clock } from '../../shared/Clock.ts'
import { DomainError } from '../../shared/DomainError.ts'
import type { IdGenerator } from '../../shared/IdGenerator.ts'
import { addDays, daysBetween, localDateOf, type LocalDate } from '../../shared/LocalDate.ts'
import {
  autoConfirmAt,
  canCreateNext,
  creationOpensAt,
  nextStartDate,
} from '../domain/nextMission.ts'
import { TEAM_NAMES, type TeamNumber } from '../domain/Team.ts'
import { assignTeams, teamForLateJoiner } from '../domain/teamAssignment.ts'
import {
  TeamMission,
  type MissionStatus,
  type TeamStanding,
  type WaypointStanding,
} from '../domain/TeamMission.ts'
import type { TeamMissionRepository } from '../domain/TeamMissionRepository.ts'

export interface TeamMissionDeps {
  readonly repository: TeamMissionRepository
  readonly clock: Clock
  readonly members: MemberDirectory
  readonly history: StepHistory
  readonly candidates: MissionCandidateCatalog
  readonly ids: IdGenerator
  /** チーム数（PoC は2、本番は3）。 */
  readonly teamCount: number
}

export interface TeamView {
  readonly team: TeamNumber
  readonly name: string
  readonly memberCount: number
  readonly standing: TeamStanding
  readonly waypoints: readonly WaypointStanding[]
}

/** 「隊」の画面に出す内容。 */
export type TeamMissionView =
  | {
      readonly kind: 'none'
      /** 最初のミッションは誰でも作成できる。 */
      readonly candidates: readonly MissionPlan[]
    }
  | {
      readonly kind: 'mission'
      readonly missionId: string
      readonly plan: MissionPlan
      readonly status: MissionStatus
      readonly startDate: LocalDate
      readonly endDate: LocalDate
      readonly finalDay: LocalDate | null
      readonly firstArrivedTeam: TeamNumber | null
      readonly stepDeadline: Date
      /** 期限まであと何日（今日を含む）。進行中のときだけ。 */
      readonly daysLeft: number | null
      readonly myTeam: TeamNumber | null
      /** 今日の自分の歩数が、隊の上位2名に入っているか。 */
      readonly myTopTwoToday: boolean
      readonly teams: readonly TeamView[]
      readonly waypoints: readonly WaypointPlan[]
      readonly winners: readonly TeamNumber[]
      /** 次のミッションの作成（最終順位が確定した後）。 */
      readonly next: {
        readonly canCreate: boolean
        readonly opensAt: Date
        readonly autoConfirmAt: Date
        readonly startDate: LocalDate
        readonly candidates: readonly MissionPlan[]
      } | null
    }

/**
 * チームミッションのユースケース（DOMAINS.md）。
 * - ミッションは1本の流れで、最後のものが今のミッション。
 * - 開始日の 0:00 になったら、登録しているメンバー全員を平均歩数でバランスを取って振り分ける。
 * - 開始後に登録したメンバーは途中参加として、人数の少ない隊に入れる。
 * - 誰も次のミッションを作成しなければ、最終順位が確定した日の 23:59 を過ぎた時点で一番上の候補で確定する。
 * 時刻で起きることは tick() でまとめて進める（画面を開いたとき・操作のたびに呼ぶ）。
 */
export class TeamMissionService {
  private readonly deps: TeamMissionDeps

  constructor(deps: TeamMissionDeps) {
    this.deps = deps
  }

  async current(): Promise<TeamMission | null> {
    return (await this.deps.repository.load()).missions.at(-1) ?? null
  }

  /** 時刻で起きること（自動確定・開始時の振り分け・途中参加）を進める。 */
  async tick(): Promise<void> {
    const now = this.deps.clock.now()
    const missions = [...(await this.deps.repository.load()).missions]
    let changed = false
    const last = missions.at(-1)
    if (last && last.status(now) === 'finalized' && now >= autoConfirmAt(last)) {
      const candidates = await this.deps.candidates.list()
      missions.push(await this.newMission(candidates[0], nextStartDate(last)))
      changed = true
    }
    const current = missions.at(-1)
    if (current && (await this.assignMembers(current, now))) changed = true
    if (changed) await this.deps.repository.save({ missions })
  }

  /**
   * ミッションを作成する。最初のミッションは誰でも作成でき、翌日に始まる。
   * 2つ目からは、前回の優勝チームのメンバーが、最終順位の確定から自動確定までの間に作成できる。
   */
  async createMission(memberId: MemberId, candidateId: string): Promise<TeamMission> {
    await this.tick()
    const now = this.deps.clock.now()
    const missions = [...(await this.deps.repository.load()).missions]
    const last = missions.at(-1)
    let startDate: LocalDate
    if (!last) {
      startDate = addDays(localDateOf(now), 1)
    } else {
      if (!canCreateNext(memberId, last, now, false)) {
        throw new DomainError('次のミッションを作成できるのは、前回の優勝チームのメンバーだけです')
      }
      startDate = nextStartDate(last)
    }
    const candidates = await this.deps.candidates.list()
    const plan = candidates.find((c) => c.candidateId === candidateId)
    if (!plan) throw new DomainError(`ミッション候補が見つかりません: ${candidateId}`)
    const mission = await this.newMission(plan, startDate)
    missions.push(mission)
    await this.deps.repository.save({ missions })
    return mission
  }

  async onStepsRecorded(event: StepsRecorded): Promise<void> {
    await this.tick()
    const now = this.deps.clock.now()
    const { missions } = await this.deps.repository.load()
    const active = missions.filter((m) => m.status(now) !== 'finalized')
    if (active.length === 0) return
    for (const m of active) m.recordSteps(event)
    await this.deps.repository.save({ missions })
  }

  async view(memberId: MemberId): Promise<TeamMissionView> {
    await this.tick()
    const now = this.deps.clock.now()
    const today = localDateOf(now)
    const mission = await this.current()
    if (!mission) return { kind: 'none', candidates: await this.deps.candidates.list() }
    const status = mission.status(now)
    const standings = mission.standings(now)
    const myTeam = mission.teamOf(memberId)
    const finalized = status === 'finalized'
    return {
      kind: 'mission',
      missionId: mission.id,
      plan: mission.plan,
      status,
      startDate: mission.startDate,
      endDate: mission.endDate,
      finalDay: mission.finalDay,
      firstArrivedTeam: mission.firstArrivedTeam,
      stepDeadline: mission.stepDeadline,
      daysLeft: status === 'inProgress' ? daysBetween(today, mission.lastDay) + 1 : null,
      myTeam,
      myTopTwoToday: myTeam !== null && mission.topTwoMembersOn(myTeam, today).includes(memberId),
      teams: standings.map((standing) => ({
        team: standing.team,
        name: TEAM_NAMES[standing.team],
        memberCount: mission.membersOf(standing.team).length,
        standing,
        waypoints: mission.waypointStandings(standing.team),
      })),
      waypoints: mission.plan.waypoints,
      winners: mission.winners(now),
      next: finalized
        ? {
            canCreate: canCreateNext(memberId, mission, now, false),
            opensAt: creationOpensAt(mission),
            autoConfirmAt: autoConfirmAt(mission),
            startDate: nextStartDate(mission),
            candidates: await this.deps.candidates.list(),
          }
        : null,
    }
  }

  private async newMission(plan: MissionPlan, startDate: LocalDate): Promise<TeamMission> {
    await this.deps.candidates.markUsed(plan.candidateId)
    return TeamMission.start(this.deps.ids.next(), plan, startDate, this.deps.teamCount, [])
  }

  /**
   * 開始後のミッションにメンバーを入れる。誰も入っていなければ開始時の振り分け（全員を平均歩数で）、
   * すでに振り分け済みなら、まだ入っていない人を途中参加として入れる。
   * 入れた人のこれまでの歩数（期間内の分）は、入れた時刻に反映された扱いで取り込む。
   * 戻り値は、だれかを入れたか。
   */
  private async assignMembers(mission: TeamMission, now: Date): Promise<boolean> {
    if (mission.status(now) !== 'inProgress') return false
    const all = await this.deps.members.members()
    const missing = all.filter((m) => mission.teamOf(m.memberId) === null)
    if (missing.length === 0) return false
    const nobodyAssigned = all.length === missing.length
    if (nobodyAssigned) {
      const until = addDays(mission.startDate, -1)
      const assignments = assignTeams(
        await Promise.all(
          missing.map(async (m) => ({
            memberId: m.memberId,
            averageSteps: await this.deps.history.averageOf(m.memberId, m.registeredDate, until),
          })),
        ),
        mission.teamCount,
      )
      for (const a of assignments) mission.addMember(a.memberId, a.team)
    } else {
      for (const m of missing) {
        const counts = new Map(
          ([1, 2, 3] as const)
            .slice(0, mission.teamCount)
            .map((t) => [t, mission.membersOf(t).length] as const),
        )
        mission.addMember(m.memberId, teamForLateJoiner(counts))
      }
    }
    for (const m of missing) {
      const history = await this.deps.history.stepsOf(m.memberId)
      for (const s of history) {
        mission.recordSteps({
          type: 'StepsRecorded',
          memberId: m.memberId,
          date: s.date,
          steps: s.steps,
          previousSteps: 0,
          reflectedAt: now,
        })
      }
    }
    return true
  }
}
