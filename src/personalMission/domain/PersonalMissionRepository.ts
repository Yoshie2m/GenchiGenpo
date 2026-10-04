import type { PersonalMission } from './PersonalMission.ts'

export interface PersonalMissionRepository {
  load(): PersonalMission[]
  save(missions: readonly PersonalMission[]): void
}
