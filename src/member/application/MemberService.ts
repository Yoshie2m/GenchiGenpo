import type { MemberId } from '../../publishedLanguage/memberId.ts'
import type { MemberDirectory, MemberSummary } from '../../publishedLanguage/queries.ts'
import type { Clock } from '../../shared/Clock.ts'
import type { IdGenerator } from '../../shared/IdGenerator.ts'
import { localDateOf, type LocalDate } from '../../shared/LocalDate.ts'
import { Member } from '../domain/Member.ts'
import type { MemberRepository } from '../domain/MemberRepository.ts'

/** メンバーのユースケース。ほかのコンテキストには MemberDirectory として ID と最小限の情報を渡す。 */
export class MemberService implements MemberDirectory {
  private readonly repository: MemberRepository
  private readonly clock: Clock
  private readonly ids: IdGenerator

  constructor(repository: MemberRepository, clock: Clock, ids: IdGenerator) {
    this.repository = repository
    this.clock = clock
    this.ids = ids
  }

  /** 登録する。登録日は今日（日本時間）。 */
  register(displayName: string): Member {
    const member = Member.register(this.ids.next(), displayName, localDateOf(this.clock.now()))
    this.repository.save([...this.repository.load(), member])
    return member
  }

  /** メンバーをまとめて入れ替える（ダミーデータの取り込み用）。 */
  replaceAll(members: readonly Member[]): void {
    this.repository.save(members)
  }

  members(): MemberSummary[] {
    return this.repository.load().map((m) => ({
      memberId: m.id,
      displayName: m.displayName,
      registeredDate: m.registeredDate,
    }))
  }

  find(memberId: MemberId): MemberSummary | undefined {
    return this.members().find((m) => m.memberId === memberId)
  }

  registeredDateOf(memberId: MemberId): LocalDate | undefined {
    return this.find(memberId)?.registeredDate
  }
}
