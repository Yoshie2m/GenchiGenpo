import type { MemberId } from '../../publishedLanguage/memberId.ts'
import type { StepsRecorded } from '../../publishedLanguage/stepRecordEvents.ts'
import type { LocalDate } from '../../shared/LocalDate.ts'
import { stepsToRi } from '../domain/distance.ts'
import { PersonalMission } from '../domain/PersonalMission.ts'
import type { PersonalMissionRepository } from '../domain/PersonalMissionRepository.ts'
import { progressPercentOf } from '../domain/progress.ts'
import type { Checkpoint, Route } from '../domain/Route.ts'

/** 「道中」の画面に出す内容。 */
export interface JourneyView {
  readonly routeName: string
  readonly startDate: LocalDate
  readonly cumulativeSteps: number
  readonly goalSteps: number
  /** 出発地（ルートの最初の通過点）。 */
  readonly start: Checkpoint
  /** 目的地（ルートの最後の通過点）。 */
  readonly goal: Checkpoint
  readonly current: Checkpoint
  readonly next: Checkpoint | null
  readonly stepsToNext: number
  readonly completed: boolean
  /** 総道のり（里）。総歩数を歩幅72cmで距離に換算したもの。 */
  readonly totalDistanceRi: number
  /** 現在の進捗（完遂率、%）。累計歩数 ÷ 総歩数の切り捨てで、上限は100。 */
  readonly progressPercent: number
  /** 街道の線に載せる通過点（直前に着いた2つと、これからの3つ）。 */
  readonly nearby: readonly { readonly checkpoint: Checkpoint; readonly passed: boolean }[]
  /** 通過記録（新しい順）。 */
  readonly arrivals: readonly { readonly checkpoint: Checkpoint; readonly arrivedAt: Date }[]
}

/** 個人ミッションのユースケース。「歩数が記録された」を受け取って旅を進める。 */
export class PersonalMissionService {
  private readonly repository: PersonalMissionRepository
  private readonly route: Route

  constructor(repository: PersonalMissionRepository, route: Route) {
    this.repository = repository
    this.route = route
  }

  /** まだ旅立っていなければ旅立たせる（登録日から）。 */
  async ensureStarted(memberId: MemberId, registeredDate: LocalDate): Promise<void> {
    if (await this.repository.findByMember(memberId)) return
    await this.repository.save(PersonalMission.begin(memberId, this.route, registeredDate))
  }

  async onStepsRecorded(event: StepsRecorded): Promise<void> {
    const mission =
      (await this.repository.findByMember(event.memberId)) ??
      PersonalMission.begin(event.memberId, this.route, event.date)
    mission.recordSteps(event)
    await this.repository.save(mission)
  }

  async view(memberId: MemberId): Promise<JourneyView | null> {
    const mission = await this.repository.findByMember(memberId)
    if (!mission) return null
    const cps = this.route.checkpoints
    const currentIndex = cps.indexOf(mission.currentCheckpoint)
    const from = Math.max(0, currentIndex - 1)
    const to = Math.min(cps.length, currentIndex + 4)
    const goalSteps = cps[cps.length - 1].cumulativeSteps
    return {
      routeName: this.route.name,
      startDate: mission.startDate,
      cumulativeSteps: mission.cumulativeSteps,
      goalSteps,
      start: cps[0],
      goal: cps[cps.length - 1],
      current: mission.currentCheckpoint,
      next: mission.nextCheckpoint,
      stepsToNext: mission.stepsToNext,
      completed: mission.isCompleted,
      totalDistanceRi: stepsToRi(goalSteps),
      progressPercent: progressPercentOf(mission.cumulativeSteps, goalSteps),
      nearby: cps
        .slice(from, to)
        .map((checkpoint, i) => ({ checkpoint, passed: from + i <= currentIndex })),
      arrivals: [...mission.checkpointArrivals]
        .reverse()
        .map((a) => ({ checkpoint: cps[a.checkpointIndex], arrivedAt: a.arrivedAt })),
    }
  }
}
