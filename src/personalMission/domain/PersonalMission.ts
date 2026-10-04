import type { MemberId } from '../../publishedLanguage/memberId.ts'
import type { StepsRecorded } from '../../publishedLanguage/stepRecordEvents.ts'
import { atJst, type LocalDate } from '../../shared/LocalDate.ts'
import { assertValidRoute, type Checkpoint, type Route } from './Route.ts'

/** 保存・復元に使う形（ドメインの外へ渡すただのデータ）。 */
export interface PersonalMissionSnapshot {
  readonly memberId: MemberId
  readonly startDate: LocalDate
  readonly stepsByDate: readonly (readonly [LocalDate, number])[]
  readonly arrivals: readonly CheckpointArrival[]
}

/** 通過点に着いた記録（どの通過点に、いつ着いたか）。 */
export interface CheckpointArrival {
  readonly checkpointIndex: number
  readonly arrivedAt: Date
}

/**
 * メンバー一人の旅（DOMAINS.md「個人ミッション」）。メンバーごとに1つ。
 * 累計歩数が次の通過点に達するたびに、通過点に着いた記録が残り、目標が次の通過点へ進む。
 * 着いても記録が残るだけで、ほかには何も起きない。
 */
export class PersonalMission {
  readonly memberId: MemberId
  readonly route: Route
  /** 旅立ちの日（2026年10月1日、または10月1日からの歩数がないメンバーは登録日）。 */
  readonly startDate: LocalDate
  private readonly stepsByDate: Map<LocalDate, number>
  private readonly arrivals: CheckpointArrival[]

  private constructor(
    memberId: MemberId,
    route: Route,
    startDate: LocalDate,
    stepsByDate: Map<LocalDate, number>,
    arrivals: CheckpointArrival[],
  ) {
    this.memberId = memberId
    this.route = route
    this.startDate = startDate
    this.stepsByDate = stepsByDate
    this.arrivals = arrivals
  }

  /** 旅立ち。出発地には旅立ちの日の 0:00 に着いた扱いにする。 */
  static begin(memberId: MemberId, route: Route, startDate: LocalDate): PersonalMission {
    assertValidRoute(route)
    return new PersonalMission(memberId, route, startDate, new Map(), [
      { checkpointIndex: 0, arrivedAt: atJst(startDate) },
    ])
  }

  /** 保存したデータから復元する。ルートは固定なので、保存せずに渡す。 */
  static fromSnapshot(snapshot: PersonalMissionSnapshot, route: Route): PersonalMission {
    assertValidRoute(route)
    return new PersonalMission(
      snapshot.memberId,
      route,
      snapshot.startDate,
      new Map(snapshot.stepsByDate),
      [...snapshot.arrivals],
    )
  }

  toSnapshot(): PersonalMissionSnapshot {
    return {
      memberId: this.memberId,
      startDate: this.startDate,
      stepsByDate: [...this.stepsByDate.entries()],
      arrivals: [...this.arrivals],
    }
  }

  /**
   * 歩数が記録されたときに呼ぶ。その日の歩数を置き換え、着いた通過点を記録する（一度に複数着くこともある）。
   * 着いた時刻は、歩いた日ではなく反映日時。旅立ちの日より前の歩数は数えない。
   * 誤入力の修正で累計歩数が減っても、一度着いた記録は消さない。
   * 戻り値は、今回新しく着いた通過点。
   */
  recordSteps(event: StepsRecorded): Checkpoint[] {
    if (event.memberId !== this.memberId || event.date < this.startDate) return []
    this.stepsByDate.set(event.date, event.steps)
    const reached: Checkpoint[] = []
    const total = this.cumulativeSteps
    for (let i = this.lastArrivedIndex + 1; i < this.route.checkpoints.length; i++) {
      const cp = this.route.checkpoints[i]
      if (cp.cumulativeSteps > total) break
      this.arrivals.push({ checkpointIndex: i, arrivedAt: event.reflectedAt })
      reached.push(cp)
    }
    return reached
  }

  get cumulativeSteps(): number {
    let sum = 0
    for (const steps of this.stepsByDate.values()) sum += steps
    return sum
  }

  /** 着いた記録（古い順）。 */
  get checkpointArrivals(): readonly CheckpointArrival[] {
    return this.arrivals
  }

  /** 最後に着いた通過点（今いる国の景色を出すのに使う）。 */
  get currentCheckpoint(): Checkpoint {
    return this.route.checkpoints[this.lastArrivedIndex]
  }

  /** 次の通過点。ゴールに着いた後は null。 */
  get nextCheckpoint(): Checkpoint | null {
    return this.route.checkpoints[this.lastArrivedIndex + 1] ?? null
  }

  /** 次の通過点までの残り歩数。ゴールに着いた後は 0。 */
  get stepsToNext(): number {
    const next = this.nextCheckpoint
    return next ? Math.max(0, next.cumulativeSteps - this.cumulativeSteps) : 0
  }

  get isCompleted(): boolean {
    return this.nextCheckpoint === null
  }

  private get lastArrivedIndex(): number {
    return this.arrivals[this.arrivals.length - 1].checkpointIndex
  }
}
