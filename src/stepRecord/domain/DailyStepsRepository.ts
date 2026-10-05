import type { MemberId } from '../../publishedLanguage/memberId.ts'
import type { LocalDate } from '../../shared/LocalDate.ts'
import type { DailySteps } from './DailySteps.ts'

export interface DailyStepsRepository {
  findOne(memberId: MemberId, date: LocalDate): Promise<DailySteps | null>
  /**
   * 保存する。`guard` が true のときは、今の値より小さいときは保存しない
   * （歩数の「日次合計の上書き」ルール。ARCHITECTURE.md「`daily_steps` の日次上書きルール」）。
   */
  save(record: DailySteps, guard: boolean): Promise<void>
  /** そのメンバーの歩数（新しい日から順とは限らない）。`range` を渡すとその期間だけに絞る。 */
  findByMember(
    memberId: MemberId,
    range?: { readonly from: LocalDate; readonly until: LocalDate },
  ): Promise<DailySteps[]>
  /** その日の、全メンバーの歩数。 */
  findByDate(date: LocalDate): Promise<DailySteps[]>
}
