import type { LocalDate } from '../shared/LocalDate.ts'
import type { MemberId } from './memberId.ts'

/**
 * 歩数記録 → チームミッション・個人ミッション: メンバーのある日の歩数が記録された（DOMAINS.md 2章）。
 * steps はその日の合計歩数（1日の上限歩数を当てはめた後）。reflectedAt は反映日時で、
 * 到達日や中間地点の到着順はこの時刻で決まる。
 */
export interface StepsRecorded {
  readonly type: 'StepsRecorded'
  readonly memberId: MemberId
  readonly date: LocalDate
  readonly steps: number
  /** 記録する前のその日の歩数（初めての記録なら 0）。 */
  readonly previousSteps: number
  readonly reflectedAt: Date
}
