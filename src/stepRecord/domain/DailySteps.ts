import type { MemberId } from '../../publishedLanguage/memberId.ts'
import type { StepsRecorded } from '../../publishedLanguage/stepRecordEvents.ts'
import { DomainError } from '../../shared/DomainError.ts'
import { localDateOf, parseLocalDate, type LocalDate } from '../../shared/LocalDate.ts'
import { capSteps, type Steps } from './Steps.ts'

/** 歩数の取り込み元（DOMAINS.md）。どの取り込み元でも、上限と上書きのルールは同じ。 */
export type StepSource = 'manual' | 'iosShortcut' | 'screenCapture'

/** 歩数を受け付ける最初の日。これより前の歩数は記録しない（個人ミッションは 2026年10月1日から）。 */
export const RECORDING_START_DATE = parseLocalDate('2026-10-01')

/** 記録・更新の結果。歩数が変わらなかったときは event がない。 */
export interface DailyStepsChange {
  readonly dailySteps: DailySteps
  readonly event: StepsRecorded | null
  /** 入力が 30,000 歩を超えていて、上限で止めたか。 */
  readonly capped: boolean
}

/**
 * 特定のメンバー・特定の日の歩数（その日の合計）。メンバー × 日付ごとに1つ。
 * 新しい値で上書きする。今より小さい値は受け付けない（減らせるのは誤入力の修正だけ）。
 */
export class DailySteps {
  readonly memberId: MemberId
  readonly date: LocalDate
  readonly steps: Steps
  readonly source: StepSource
  /** 反映日時。歩数が最後に変わった時刻。 */
  readonly reflectedAt: Date

  private constructor(
    memberId: MemberId,
    date: LocalDate,
    steps: Steps,
    source: StepSource,
    reflectedAt: Date,
  ) {
    this.memberId = memberId
    this.date = date
    this.steps = steps
    this.source = source
    this.reflectedAt = reflectedAt
  }

  /** その日の最初の記録。 */
  static record(
    memberId: MemberId,
    date: LocalDate,
    input: number,
    source: StepSource,
    now: Date,
  ): DailyStepsChange {
    assertRecordableDate(date, now)
    const { steps, capped } = capSteps(input)
    const dailySteps = new DailySteps(memberId, date, steps, source, now)
    return { dailySteps, event: stepsRecorded(dailySteps, 0), capped }
  }

  /** 保存したデータから復元する。 */
  static reconstruct(
    memberId: MemberId,
    date: LocalDate,
    steps: number,
    source: StepSource,
    reflectedAt: Date,
  ): DailySteps {
    return new DailySteps(memberId, date, capSteps(steps).steps, source, reflectedAt)
  }

  /**
   * その日の合計歩数を新しい値で上書きする。今より小さい値は受け付けない。
   * 上限を当てはめた後の値が今と同じなら、何も変えない（反映日時も変わらない）。
   */
  update(input: number, source: StepSource, now: Date): DailyStepsChange {
    const { steps, capped } = capSteps(input)
    if (steps < this.steps) {
      throw new DomainError(
        `${this.date} の歩数は ${this.steps} 歩より少なくできません（入力: ${input} 歩）。誤入力のときは修正してください`,
      )
    }
    return this.changeTo(steps, source, now, capped)
  }

  /**
   * 誤入力の修正。本人が確認画面で行い、歩数を減らすことも認める（DOMAINS.md）。
   * 受け付ける期限（歩数受付締切）はチームミッションの決まりなので、歩数記録では判定しない。
   * 締切を過ぎた変更をチームミッションに数えないのは、チームミッション側で判断する。
   */
  correct(input: number, now: Date): DailyStepsChange {
    const { steps, capped } = capSteps(input)
    return this.changeTo(steps, 'manual', now, capped)
  }

  private changeTo(steps: Steps, source: StepSource, now: Date, capped: boolean): DailyStepsChange {
    if (steps === this.steps) return { dailySteps: this, event: null, capped }
    const dailySteps = new DailySteps(this.memberId, this.date, steps, source, now)
    return { dailySteps, event: stepsRecorded(dailySteps, this.steps), capped }
  }
}

function assertRecordableDate(date: LocalDate, now: Date): void {
  if (date < RECORDING_START_DATE) {
    throw new DomainError(`${RECORDING_START_DATE} より前の日の歩数は記録できません: ${date}`)
  }
  if (date > localDateOf(now)) {
    throw new DomainError(`今日より後の日の歩数は記録できません: ${date}`)
  }
}

function stepsRecorded(dailySteps: DailySteps, previousSteps: number): StepsRecorded {
  return {
    type: 'StepsRecorded',
    memberId: dailySteps.memberId,
    date: dailySteps.date,
    steps: dailySteps.steps,
    previousSteps,
    reflectedAt: dailySteps.reflectedAt,
  }
}
