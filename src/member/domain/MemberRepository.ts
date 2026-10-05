import type { Member } from './Member.ts'

export interface MemberRepository {
  load(): Promise<Member[]>
  save(members: readonly Member[]): Promise<void>
}
