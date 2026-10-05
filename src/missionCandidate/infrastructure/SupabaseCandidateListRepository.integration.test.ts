import { adminClient } from '../../../tests/supabaseTestClient.ts'
import { CandidateList } from '../domain/CandidateList.ts'
import { MISSION_CANDIDATES } from '../masterData/missionCandidates.ts'
import { SupabaseCandidateListRepository } from './SupabaseCandidateListRepository.ts'

/**
 * ローカルSupabase CLIに実際に接続する結合テスト（ARCHITECTURE.md「テストの方針」）。
 * `candidate_order`（候補の中身はマスターデータのまま、保存するのは並び順だけ）を確認する。
 */
describe('SupabaseCandidateListRepository（結合テスト）', () => {
  // service_role を使い、RLS（認証済みなら誰でも読み書き可）の確認は他のテストに任せる。
  const repository = new SupabaseCandidateListRepository(adminClient())

  test('保存がなければ、マスターデータの並び順をそのまま返す', async () => {
    await repository.save(CandidateList.of(MISSION_CANDIDATES))
    const list = await repository.load(MISSION_CANDIDATES)
    expect(list.candidates.map((c) => c.candidateId)).toEqual(
      MISSION_CANDIDATES.map((c) => c.candidateId),
    )
  })

  test('markUsed で一番下に回した並び順が、読み直しても保たれる', async () => {
    const used = MISSION_CANDIDATES[0].candidateId
    const list = CandidateList.of(MISSION_CANDIDATES).markUsed(used)
    await repository.save(list)

    const loaded = await repository.load(MISSION_CANDIDATES)

    expect(loaded.candidates.map((c) => c.candidateId)).toEqual(
      list.candidates.map((c) => c.candidateId),
    )
    expect(loaded.candidates.at(-1)!.candidateId).toBe(used)
  })
})
