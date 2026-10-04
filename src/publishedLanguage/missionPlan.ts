/**
 * ミッション候補 → チームミッション: 選ばれた候補の内容（DOMAINS.md 2章）。
 * ミッションは作成時にこの内容を写し取り、その後に候補の一覧が変わっても変わらない。
 */
export interface MissionPlan {
  readonly candidateId: string
  readonly destination: DestinationInfo
  /** 到達に必要な進行歩数。 */
  readonly targetSteps: number
  /** 期間の日数（開始日を1日目とする）。 */
  readonly periodDays: number
  readonly waypoints: readonly WaypointPlan[]
}

export interface DestinationInfo {
  readonly name: string
  /** 代表漢字（2文字）とその読み。 */
  readonly kanji: string
  readonly reading: string
  /** 所在地（旧国名）。 */
  readonly province: string
  readonly memo: string
}

export interface WaypointPlan {
  readonly name: string
  /** 通過に必要な進行歩数。 */
  readonly progressSteps: number
  /** 中間通過ポイント（歩数）。3位は 0 歩。 */
  readonly points: { readonly first: number; readonly second: number }
}
