import type { MemberId } from '../../publishedLanguage/memberId.ts'
import type { StepHistory } from '../../publishedLanguage/queries.ts'
import type { StepsRecorded } from '../../publishedLanguage/stepRecordEvents.ts'
import type { Clock } from '../../shared/Clock.ts'
import type { LocalDate } from '../../shared/LocalDate.ts'
import { DailySteps, type DailyStepsChange, type StepSource } from '../domain/DailySteps.ts'
import type { DailyStepsRepository } from '../domain/DailyStepsRepository.ts'
import { personalAverage } from '../domain/personalAverage.ts'

/** 記録の結果（画面で知らせる内容）。 */
export interface RecordResult {
  readonly steps: number
  /** 入力が 30,000 歩を超えていて、上限で止めたか。 */
  readonly capped: boolean
  /** 歩数が変わったか（同じ値なら変わらない）。 */
  readonly changed: boolean
}

/**
 * 歩数記録のユースケース。歩数を記録して保存し、変わったら「歩数が記録された」を知らせる。
 * ほかのコンテキスト（チームミッション）には、平均歩数とこれまでの歩数を StepHistory として渡す。
 */
export class StepRecordService implements StepHistory {
  private readonly repository: DailyStepsRepository
  private readonly clock: Clock
  private readonly publish: (event: StepsRecorded) => void

  constructor(
    repository: DailyStepsRepository,
    clock: Clock,
    publish: (event: StepsRecorded) => void,
  ) {
    this.repository = repository
    this.clock = clock
    this.publish = publish
  }

  /** その日の合計歩数を記録する（今より小さい値は受け付けない）。 */
  recordSteps(
    memberId: MemberId,
    date: LocalDate,
    steps: number,
    source: StepSource,
  ): RecordResult {
    return this.recordStepsAt(memberId, date, steps, source, this.clock.now())
  }

  /** 反映日時を指定して記録する（ダミーデータの取り込み用）。 */
  recordStepsAt(
    memberId: MemberId,
    date: LocalDate,
    steps: number,
    source: StepSource,
    at: Date,
  ): RecordResult {
    return this.change(memberId, date, (existing) =>
      existing
        ? existing.update(steps, source, at)
        : DailySteps.record(memberId, date, steps, source, at),
    )
  }

  /** 誤入力の修正（本人が確認画面で行う。歩数を減らすこともできる）。 */
  correctSteps(memberId: MemberId, date: LocalDate, steps: number): RecordResult {
    const now = this.clock.now()
    return this.change(memberId, date, (existing) =>
      existing
        ? existing.correct(steps, now)
        : DailySteps.record(memberId, date, steps, 'manual', now),
    )
  }

  /** そのメンバーの日ごとの歩数（新しい日から順）。 */
  recordsOf(memberId: MemberId): DailySteps[] {
    return this.repository
      .load()
      .filter((r) => r.memberId === memberId)
      .sort((a, b) => (a.date < b.date ? 1 : -1))
  }

  stepsOf(memberId: MemberId) {
    return this.recordsOf(memberId).map((r) => ({ date: r.date, steps: r.steps }))
  }

  /**
   * 個人の平均歩数。2026年10月1日からの歩数があればその日から、なければ登録日から数える
   * （登録日より前の記録があれば、いちばん古い記録の日から）。
   */
  averageOf(memberId: MemberId, registeredDate: LocalDate, until: LocalDate): number | null {
    const records = this.recordsOf(memberId)
    const earliest = records.at(-1)?.date
    const from = earliest !== undefined && earliest < registeredDate ? earliest : registeredDate
    return personalAverage(records, from, until)
  }

  private change(
    memberId: MemberId,
    date: LocalDate,
    apply: (existing: DailySteps | undefined) => DailyStepsChange,
  ): RecordResult {
    const all = this.repository.load()
    const index = all.findIndex((r) => r.memberId === memberId && r.date === date)
    const result = apply(index >= 0 ? all[index] : undefined)
    if (result.event) {
      if (index >= 0) all[index] = result.dailySteps
      else all.push(result.dailySteps)
      this.repository.save(all)
      this.publish(result.event)
    }
    return { steps: result.dailySteps.steps, capped: result.capped, changed: result.event !== null }
  }
}
