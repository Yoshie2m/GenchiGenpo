import { adminClient, createAuthedMember } from '../../../tests/supabaseTestClient.ts'
import { parseLocalDate } from '../../shared/LocalDate.ts'
import { Member } from '../domain/Member.ts'
import { SupabaseMemberRepository } from './SupabaseMemberRepository.ts'

/**
 * ローカルSupabase CLI（`supabase start`）に実際に接続する結合テスト（ARCHITECTURE.md「テストの方針」）。
 * `members` テーブルのRLS（本人だけ書ける、読み取りは認証済みなら全員可）を確認する。
 */
describe('SupabaseMemberRepository（結合テスト）', () => {
  test('本人は自分の行を作れ、認証済みなら誰でも読める', async () => {
    const admin = adminClient()
    const { client, userId } = await createAuthedMember(admin)
    const repository = new SupabaseMemberRepository(client)
    const member = Member.register(userId, 'テスト太郎', parseLocalDate('2026-10-01'))

    await repository.add(member)

    const all = await repository.all()
    expect(all.map((m) => m.id)).toContain(userId)
    const found = all.find((m) => m.id === userId)!
    expect(found.displayName).toBe('テスト太郎')
    expect(found.registeredDate).toBe('2026-10-01')
  })

  test('他人のIDでは行を作れない（RLS）', async () => {
    const admin = adminClient()
    const { client } = await createAuthedMember(admin)
    const repository = new SupabaseMemberRepository(client)
    const somebodyElse = Member.register(
      '00000000-0000-0000-0000-000000000000',
      '不正',
      parseLocalDate('2026-10-01'),
    )

    await expect(repository.add(somebodyElse)).rejects.toThrow()
  })

  test('replaceAll は全員を入れ替える（開発用のダミーデータ取り込み。service_roleで直接確認）', async () => {
    const admin = adminClient()
    const repository = new SupabaseMemberRepository(admin)
    const { userId: id1 } = await createAuthedMember(admin)
    const { userId: id2 } = await createAuthedMember(admin)
    const members = [
      Member.register(id1, 'ダミー1', parseLocalDate('2026-10-01')),
      Member.register(id2, 'ダミー2', parseLocalDate('2026-10-02')),
    ]

    await repository.replaceAll(members)

    const all = await repository.all()
    expect(all.map((m) => m.id).sort()).toEqual([id1, id2].sort())
  })
})
