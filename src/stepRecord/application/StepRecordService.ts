import type { MemberId } from '../../publishedLanguage/memberId.ts'
import type { MemberSummary, StepHistory } from '../../publishedLanguage/queries.ts'
import type { StepsRecorded } from '../../publishedLanguage/stepRecordEvents.ts'
import type { Clock } from '../../shared/Clock.ts'
import { addDays, daysBetween, type LocalDate } from '../../shared/LocalDate.ts'
import {
  DailySteps,
  RECORDING_START_DATE,
  type DailyStepsChange,
  type StepSource,
} from '../domain/DailySteps.ts'
import type { DailyStepsRepository } from '../domain/DailyStepsRepository.ts'
import { achievementDaysOf, specialMission } from '../domain/achievementDays.ts'
import type { SpecialMission, TierMember } from '../domain/achievementDays.ts'
import { topEntries, type LeaderboardEntry } from '../domain/leaderboard.ts'
import { personalAverage } from '../domain/personalAverage.ts'

export type { LeaderboardEntry, SpecialMission, TierMember }

/** 番付（今日の歩数・全日数の総歩数・平均歩数の上位5名）。 */
export interface Leaderboard {
  readonly today: readonly LeaderboardEntry[]
  readonly total: readonly LeaderboardEntry[]
  readonly average: readonly LeaderboardEntry[]
}

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
  private readonly publish: (event: StepsRecorded) => void | Promise<void>

  constructor(
    repository: DailyStepsRepository,
    clock: Clock,
    publish: (event: StepsRecorded) => void | Promise<void>,
  ) {
    this.repository = repository
    this.clock = clock
    this.publish = publish
  }

  /** その日の合計歩数を記録する（今より小さい値は受け付けない）。 */
  async recordSteps(
    memberId: MemberId,
    date: LocalDate,
    steps: number,
    source: StepSource,
  ): Promise<RecordResult> {
    return this.recordStepsAt(memberId, date, steps, source, this.clock.now())
  }

  /** 反映日時を指定して記録する（ダミーデータの取り込み用）。 */
  async recordStepsAt(
    memberId: MemberId,
    date: LocalDate,
    steps: number,
    source: StepSource,
    at: Date,
  ): Promise<RecordResult> {
    return this.change(
      memberId,
      date,
      (existing) =>
        existing
          ? existing.update(steps, source, at)
          : DailySteps.record(memberId, date, steps, source, at),
      true,
    )
  }

  /** 誤入力の修正（本人が確認画面で行う。歩数を減らすこともできる）。 */
  async correctSteps(memberId: MemberId, date: LocalDate, steps: number): Promise<RecordResult> {
    const now = this.clock.now()
    return this.change(
      memberId,
      date,
      (existing) =>
        existing
          ? existing.correct(steps, now)
          : DailySteps.record(memberId, date, steps, 'manual', now),
      false,
    )
  }

  /** そのメンバーの日ごとの歩数（新しい日から順）。 */
  async recordsOf(memberId: MemberId): Promise<DailySteps[]> {
    return (await this.repository.findByMember(memberId)).sort((a, b) => (a.date < b.date ? 1 : -1))
  }

  async stepsOf(memberId: MemberId) {
    return (await this.recordsOf(memberId)).map((r) => ({ date: r.date, steps: r.steps }))
  }

  /**
   * 個人の平均歩数。2026年10月1日からの歩数があればその日から、なければ登録日から数える
   * （登録日より前の記録があれば、いちばん古い記録の日から）。
   */
  async averageOf(
    memberId: MemberId,
    registeredDate: LocalDate,
    until: LocalDate,
  ): Promise<number | null> {
    const records = await this.repository.findByMember(memberId, {
      from: RECORDING_START_DATE,
      until,
    })
    const earliest = records.reduce<LocalDate | undefined>(
      (min, r) => (min === undefined || r.date < min ? r.date : min),
      undefined,
    )
    const from = earliest !== undefined && earliest < registeredDate ? earliest : registeredDate
    return personalAverage(records, from, until)
  }

  /**
   * 番付: 登録メンバーの今日の歩数・全日数の総歩数・平均歩数の上位5名（DOMAINS.md「番付」）。
   * - 今日の歩数: 今日の歩数を記録したメンバーだけを並べる。
   * - 総歩数: 2026年10月1日からのすべての記録の合計。
   * - 平均歩数: 個人の平均歩数を、昨日までのすべての日（記録しなかった日は 0 歩）で出す。
   *   今日はまだ途中の歩数なので数えない。昨日までに数える日がない人（今日登録した人）は載せない。
   */
  async leaderboard(members: readonly MemberSummary[], today: LocalDate): Promise<Leaderboard> {
    const todayRecords = await this.repository.findByDate(today)
    const totals = await Promise.all(
      members.map(async (m) => {
        const records = await this.repository.findByMember(m.memberId, {
          from: RECORDING_START_DATE,
          until: today,
        })
        return records.reduce((sum, r) => sum + r.steps, 0)
      }),
    )
    const averages = await Promise.all(
      members.map((m) => this.averageOf(m.memberId, m.registeredDate, addDays(today, -1))),
    )
    return {
      today: topEntries(
        members.flatMap((m) => {
          const r = todayRecords.find((x) => x.memberId === m.memberId)
          return r ? [{ memberId: m.memberId, value: r.steps }] : []
        }),
      ),
      total: topEntries(members.map((m, i) => ({ memberId: m.memberId, value: totals[i] }))),
      average: topEntries(
        members.flatMap((m, i) => {
          const average = averages[i]
          return average === null ? [] : [{ memberId: m.memberId, value: average }]
        }),
      ),
    }
  }

  /**
   * 特命: 全体成果（メンバー1人あたりの平均達成日数。1日8000歩以上を記録した日数）と、
   * 達成率に応じた3つの称号（極上仕事人・筆頭仕事人・精鋭仕事人）の一覧（DOMAINS.md「特命」）。
   * 対象期間は2026年10月1日から昨日まで（今日は途中の歩数なので数えない。番付の平均歩数と同じ考え方）。
   */
  async specialMission(
    members: readonly MemberSummary[],
    today: LocalDate,
  ): Promise<SpecialMission | null> {
    const until = addDays(today, -1)
    const totalDays = daysBetween(RECORDING_START_DATE, until) + 1
    const withAchievementDays = await Promise.all(
      members.map(async (m) => {
        const records = await this.repository.findByMember(m.memberId, {
          from: RECORDING_START_DATE,
          until,
        })
        return {
          memberId: m.memberId,
          displayName: m.displayName,
          achievementDays: achievementDaysOf(records, RECORDING_START_DATE, until),
        }
      }),
    )
    return specialMission(withAchievementDays, totalDays)
  }

  private async change(
    memberId: MemberId,
    date: LocalDate,
    apply: (existing: DailySteps | undefined) => DailyStepsChange,
    guard: boolean,
  ): Promise<RecordResult> {
    const existing = await this.repository.findOne(memberId, date)
    const result = apply(existing ?? undefined)
    if (result.event) {
      await this.repository.save(result.dailySteps, guard)
      await this.publish(result.event)
    }
    return { steps: result.dailySteps.steps, capped: result.capped, changed: result.event !== null }
  }
}
