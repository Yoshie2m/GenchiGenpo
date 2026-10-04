import { memberId, type MemberId } from '../../publishedLanguage/memberId.ts'
import { DomainError } from '../../shared/DomainError.ts'
import type { LocalDate } from '../../shared/LocalDate.ts'

/** システムを利用する個人（DOMAINS.md）。ほかのコンテキストには ID だけを渡す。 */
export class Member {
  readonly id: MemberId
  readonly displayName: string
  /** 登録日。10月1日からの歩数がないメンバーは、平均歩数と個人ミッションをこの日から数える。 */
  readonly registeredDate: LocalDate

  private constructor(id: MemberId, displayName: string, registeredDate: LocalDate) {
    this.id = id
    this.displayName = displayName
    this.registeredDate = registeredDate
  }

  static register(id: string, displayName: string, registeredDate: LocalDate): Member {
    const name = displayName.trim()
    if (name === '') throw new DomainError('表示名を入れてください')
    return new Member(memberId(id), name, registeredDate)
  }
}
