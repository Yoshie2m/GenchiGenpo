import type { SupabaseClient } from '@supabase/supabase-js'
import { memberId as toMemberId, type MemberId } from '../../publishedLanguage/memberId.ts'
import { parseLocalDate, type LocalDate } from '../../shared/LocalDate.ts'
import { DailySteps, type StepSource } from '../domain/DailySteps.ts'
import type { DailyStepsRepository } from '../domain/DailyStepsRepository.ts'

interface Row {
  member_id: string
  date: string
  steps: number
  source: StepSource
  reflected_at: string
}

/**
 * `daily_steps` テーブル（ARCHITECTURE.md「データ永続化（DB）設計」）。
 *
 * `guard` な保存は、PostgREST の `upsert` が `on conflict ... where` のような条件付きの
 * 上書きを表現できないため、代わりに「今の値以下のときだけ更新する」フィルタ付きの `update` を使う
 * （ARCHITECTURE.md「`daily_steps` の日次上書きルール」と同じ条件を、UPDATE の WHERE 句で表す）。
 * 影響行数が0のときは、まだ行がない（初回の記録）なら挿入し、既にある（guard に引っかかった）なら
 * 何もしない。
 */
export class SupabaseDailyStepsRepository implements DailyStepsRepository {
  private readonly client: SupabaseClient

  constructor(client: SupabaseClient) {
    this.client = client
  }

  async findOne(memberId: MemberId, date: LocalDate): Promise<DailySteps | null> {
    const { data, error } = await this.client
      .from('daily_steps')
      .select('member_id, date, steps, source, reflected_at')
      .eq('member_id', memberId)
      .eq('date', date)
      .maybeSingle()
    if (error) throw error
    return data ? toDomain(data as Row) : null
  }

  async save(record: DailySteps, guard: boolean): Promise<void> {
    const row = toRow(record)
    if (!guard) {
      const { error } = await this.client.from('daily_steps').upsert(row)
      if (error) throw error
      return
    }
    const { data, error } = await this.client
      .from('daily_steps')
      .update(row)
      .eq('member_id', row.member_id)
      .eq('date', row.date)
      .lte('steps', row.steps)
      .select('member_id')
    if (error) throw error
    if ((data?.length ?? 0) > 0) return
    const existing = await this.findOne(record.memberId, record.date)
    if (!existing) {
      const { error: insertError } = await this.client.from('daily_steps').insert(row)
      if (insertError) throw insertError
    }
  }

  async findByMember(
    memberId: MemberId,
    range?: { readonly from: LocalDate; readonly until: LocalDate },
  ): Promise<DailySteps[]> {
    let query = this.client
      .from('daily_steps')
      .select('member_id, date, steps, source, reflected_at')
      .eq('member_id', memberId)
    if (range) query = query.gte('date', range.from).lte('date', range.until)
    const { data, error } = await query
    if (error) throw error
    return (data as Row[]).map(toDomain)
  }

  async findByDate(date: LocalDate): Promise<DailySteps[]> {
    const { data, error } = await this.client
      .from('daily_steps')
      .select('member_id, date, steps, source, reflected_at')
      .eq('date', date)
    if (error) throw error
    return (data as Row[]).map(toDomain)
  }
}

function toDomain(row: Row): DailySteps {
  return DailySteps.reconstruct(
    toMemberId(row.member_id),
    parseLocalDate(row.date),
    row.steps,
    row.source,
    new Date(row.reflected_at),
  )
}

function toRow(record: DailySteps): Row {
  return {
    member_id: record.memberId,
    date: record.date,
    steps: record.steps,
    source: record.source,
    reflected_at: record.reflectedAt.toISOString(),
  }
}
