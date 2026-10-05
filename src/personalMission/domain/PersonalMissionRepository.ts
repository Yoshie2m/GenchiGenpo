import type { MemberId } from '../../publishedLanguage/memberId.ts'
import type { PersonalMission } from './PersonalMission.ts'

export interface PersonalMissionRepository {
  findByMember(memberId: MemberId): Promise<PersonalMission | null>
  save(mission: PersonalMission): Promise<void>
}
