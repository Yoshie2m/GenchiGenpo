import type { TeamMission } from './TeamMission.ts'

/** チームミッションコンテキストの状態。ミッションは1本の流れで、最後のものが今のミッション。 */
export interface TeamMissionState {
  /** これまでのミッション（古い順）。 */
  readonly missions: readonly TeamMission[]
}

export interface TeamMissionRepository {
  load(): TeamMissionState
  save(state: TeamMissionState): void
}
