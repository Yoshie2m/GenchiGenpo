import type { LocalDate } from '../shared/LocalDate.ts'
import type { MemberId } from './memberId.ts'
import type { MissionPlan } from './missionPlan.ts'
import type { StepsRecorded } from './stepRecordEvents.ts'

/**
 * コンテキスト間の問い合わせ（DOMAINS.md 2章「コンテキスト間の関係」）。
 * 受ける側はこのインターフェースだけを知り、送る側のコンテキストを直接 import しない。
 */

/** メンバー → すべて: メンバーの ID と最小限の情報。 */
export interface MemberSummary {
  readonly memberId: MemberId
  readonly displayName: string
  readonly registeredDate: LocalDate
}

export interface MemberDirectory {
  members(): Promise<readonly MemberSummary[]>
}

/** 歩数記録 → チームミッション: 個人の平均歩数（チーム振り分けに使う）と、これまでの歩数（途中参加に使う）。 */
export interface StepHistory {
  /** 平均歩数。数える日がないときは null。 */
  averageOf(memberId: MemberId, registeredDate: LocalDate, until: LocalDate): Promise<number | null>
  /** そのメンバーのこれまでの日ごとの歩数。 */
  stepsOf(
    memberId: MemberId,
  ): Promise<readonly { readonly date: LocalDate; readonly steps: number }[]>
}

/** ミッション候補 → チームミッション: 候補の一覧と、使った候補を一番下に回す操作。 */
export interface MissionCandidateCatalog {
  list(): Promise<readonly MissionPlan[]>
  markUsed(candidateId: string): Promise<void>
}

/** アプリ内で配送するイベント。 */
export type AppEvent = StepsRecorded
