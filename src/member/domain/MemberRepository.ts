import type { Member } from './Member.ts'

export interface MemberRepository {
  all(): Promise<Member[]>
  add(member: Member): Promise<void>
  /** メンバー全員を入れ替える（開発用画面のダミーデータ取り込み用）。 */
  replaceAll(members: readonly Member[]): Promise<void>
}
