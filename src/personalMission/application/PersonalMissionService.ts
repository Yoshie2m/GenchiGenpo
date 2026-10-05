import type { MemberId } from '../../publishedLanguage/memberId.ts'
import type { StepsRecorded } from '../../publishedLanguage/stepRecordEvents.ts'
import type { LocalDate } from '../../shared/LocalDate.ts'
import { PersonalMission } from '../domain/PersonalMission.ts'
import type { PersonalMissionRepository } from '../domain/PersonalMissionRepository.ts'
import type { Checkpoint, Route } from '../domain/Route.ts'

/** 「道中」の画面に出す内容。 */
export interface JourneyView {
  readonly routeName: string
  readonly startDate: LocalDate
  readonly cumulativeSteps: number
  readonly goalSteps: number
  readonly current: Checkpoint
  readonly next: Checkpoint | null
  readonly stepsToNext: number
  readonly completed: boolean
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
    return {
      routeName: this.route.name,
      startDate: mission.startDate,
      cumulativeSteps: mission.cumulativeSteps,
      goalSteps: cps[cps.length - 1].cumulativeSteps,
      current: mission.currentCheckpoint,
      next: mission.nextCheckpoint,
      stepsToNext: mission.stepsToNext,
      completed: mission.isCompleted,
      nearby: cps
        .slice(from, to)
        .map((checkpoint, i) => ({ checkpoint, passed: from + i <= currentIndex })),
      arrivals: [...mission.checkpointArrivals]
        .reverse()
        .map((a) => ({ checkpoint: cps[a.checkpointIndex], arrivedAt: a.arrivedAt })),
    }
  }
}
