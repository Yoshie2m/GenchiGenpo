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
  async register(displayName: string): Promise<Member> {
    return this.registerWithId(this.ids.next(), displayName)
  }

  /**
   * IDを指定して登録する（本番の認証フロー用。`members.id` ＝ Supabase Auth の
   * `auth.users.id` とする前提のため、ランダムなIDではなく認証済みユーザーのIDを使う）。
   */
  async registerWithId(id: string, displayName: string): Promise<Member> {
    const member = Member.register(id, displayName, localDateOf(this.clock.now()))
    await this.repository.add(member)
    return member
  }

  /** メンバーをまとめて入れ替える（ダミーデータの取り込み用）。 */
  async replaceAll(members: readonly Member[]): Promise<void> {
    await this.repository.replaceAll(members)
  }

  async members(): Promise<MemberSummary[]> {
    return (await this.repository.all()).map((m) => ({
      memberId: m.id,
      displayName: m.displayName,
      registeredDate: m.registeredDate,
    }))
  }

  async find(memberId: MemberId): Promise<MemberSummary | undefined> {
    return (await this.members()).find((m) => m.memberId === memberId)
  }

  async registeredDateOf(memberId: MemberId): Promise<LocalDate | undefined> {
    return (await this.find(memberId))?.registeredDate
  }
}
