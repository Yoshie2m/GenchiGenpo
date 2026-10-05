import type { PersonalMission } from './PersonalMission.ts'

export interface PersonalMissionRepository {
  load(): Promise<PersonalMission[]>
  save(missions: readonly PersonalMission[]): Promise<void>
}
