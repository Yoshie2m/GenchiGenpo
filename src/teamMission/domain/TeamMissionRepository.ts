import type { TeamMission } from './TeamMission.ts'

/** チームミッションコンテキストの状態。ミッションは1本の流れで、最後のものが今のミッション。 */
export interface TeamMissionState {
  /** これまでのミッション（古い順）。 */
  readonly missions: readonly TeamMission[]
}

export interface TeamMissionRepository {
  load(): Promise<{ readonly state: TeamMissionState; readonly version: number }>
  /**
   * 保存する。読み込んだときの版（`version`）と、保存しようとしている今の版が違うときは
   * 保存せず false を返す（楽観的ロック。呼び出し側が読み直して再試行する。
   * ARCHITECTURE.md「5. 実装固有の設計」Application Service「`tick()` の実行方式」）。
   */
  save(state: TeamMissionState, version: number): Promise<boolean>
}
