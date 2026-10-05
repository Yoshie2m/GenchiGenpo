import type { SupabaseClient } from '@supabase/supabase-js'
import { parseLocalDate } from '../../shared/LocalDate.ts'
import { Member } from '../domain/Member.ts'
import type { MemberRepository } from '../domain/MemberRepository.ts'

interface Row {
  id: string
  display_name: string
  registered_date: string
}

/** `members` テーブル（ARCHITECTURE.md「データ永続化（DB）設計」）。 */
export class SupabaseMemberRepository implements MemberRepository {
  private readonly client: SupabaseClient

  constructor(client: SupabaseClient) {
    this.client = client
  }

  async all(): Promise<Member[]> {
    const { data, error } = await this.client
      .from('members')
      .select('id, display_name, registered_date')
    if (error) throw error
    return (data as Row[]).map(toDomain)
  }

  async add(member: Member): Promise<void> {
    const { error } = await this.client.from('members').insert(toRow(member))
    if (error) throw error
  }

  /** 開発用画面のダミーデータ取り込み用。全員を入れ替える。 */
  async replaceAll(members: readonly Member[]): Promise<void> {
    const { error: deleteError } = await this.client.from('members').delete().not('id', 'is', null)
    if (deleteError) throw deleteError
    if (members.length === 0) return
    const { error } = await this.client.from('members').insert(members.map(toRow))
    if (error) throw error
  }
}

function toDomain(row: Row): Member {
  return Member.register(row.id, row.display_name, parseLocalDate(row.registered_date))
}

function toRow(member: Member): Row {
  return { id: member.id, display_name: member.displayName, registered_date: member.registeredDate }
}
