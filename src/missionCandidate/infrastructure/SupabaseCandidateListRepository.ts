import type { SupabaseClient } from '@supabase/supabase-js'
import type { MissionPlan } from '../../publishedLanguage/missionPlan.ts'
import { CandidateList } from '../domain/CandidateList.ts'
import type { CandidateListRepository } from '../domain/CandidateListRepository.ts'

/** `candidate_order` テーブル（ARCHITECTURE.md「データ永続化（DB）設計」）。候補の中身はマスターデータ。 */
export class SupabaseCandidateListRepository implements CandidateListRepository {
  private readonly client: SupabaseClient

  constructor(client: SupabaseClient) {
    this.client = client
  }

  async load(master: readonly MissionPlan[]): Promise<CandidateList> {
    const { data, error } = await this.client
      .from('candidate_order')
      .select('candidate_id, sort_order')
      .order('sort_order', { ascending: true })
    if (error) throw error
    if (!data || data.length === 0) return CandidateList.of(master)
    const order = new Map(
      (data as { candidate_id: string; sort_order: number }[]).map((r) => [
        r.candidate_id,
        r.sort_order,
      ]),
    )
    const sorted = [...master].sort(
      (a, b) =>
        (order.get(a.candidateId) ?? Number.MAX_SAFE_INTEGER) -
        (order.get(b.candidateId) ?? Number.MAX_SAFE_INTEGER),
    )
    return CandidateList.of(sorted)
  }

  async save(list: CandidateList): Promise<void> {
    const { error: deleteError } = await this.client
      .from('candidate_order')
      .delete()
      .not('candidate_id', 'is', null)
    if (deleteError) throw deleteError
    const rows = list.candidates.map((c, i) => ({ candidate_id: c.candidateId, sort_order: i }))
    const { error } = await this.client.from('candidate_order').insert(rows)
    if (error) throw error
  }
}
