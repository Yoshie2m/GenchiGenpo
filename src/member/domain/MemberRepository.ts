import type { Member } from './Member.ts'

export interface MemberRepository {
  load(): Member[]
  save(members: readonly Member[]): void
}
