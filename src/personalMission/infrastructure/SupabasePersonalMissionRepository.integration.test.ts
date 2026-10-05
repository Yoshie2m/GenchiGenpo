import { adminClient, createAuthedMember } from '../../../tests/supabaseTestClient.ts'
import { memberId } from '../../publishedLanguage/memberId.ts'
import { parseLocalDate } from '../../shared/LocalDate.ts'
import { PersonalMission } from '../domain/PersonalMission.ts'
import { TOKAIDO_ROUTE } from '../masterData/tokaidoRoute.ts'
import { SupabasePersonalMissionRepository } from './SupabasePersonalMissionRepository.ts'

/**
 * ローカルSupabase CLIに実際に接続する結合テスト（ARCHITECTURE.md「テストの方針」）。
 * `personal_missions`・`personal_mission_steps`・`personal_mission_arrivals`（本人だけ書ける、
 * 読み取りは認証済みなら全員可）を確認する。
 */
describe('SupabasePersonalMissionRepository（結合テスト）', () => {
  test('保存がなければ null', async () => {
    const admin = adminClient()
    const { client, userId } = await createAuthedMember(admin)
    await admin
      .from('members')
      .insert({ id: userId, display_name: 'テスト太郎', registered_date: '2026-10-01' })
    const repository = new SupabasePersonalMissionRepository(client, TOKAIDO_ROUTE)

    expect(await repository.findByMember(memberId(userId))).toBeNull()
  })

  test('累計歩数と着いた記録を保存して、同じ状態に戻せる（本人の書き込み）', async () => {
    const admin = adminClient()
    const { client, userId } = await createAuthedMember(admin)
    await admin
      .from('members')
      .insert({ id: userId, display_name: 'テスト太郎', registered_date: '2026-10-01' })
    const repository = new SupabasePersonalMissionRepository(client, TOKAIDO_ROUTE)

    const mission = PersonalMission.begin(
      memberId(userId),
      TOKAIDO_ROUTE,
      parseLocalDate('2026-10-01'),
    )
    mission.recordSteps({
      type: 'StepsRecorded',
      memberId: memberId(userId),
      date: parseLocalDate('2026-10-01'),
      steps: 30000,
      previousSteps: 0,
      reflectedAt: new Date('2026-10-01T12:00:00Z'),
    })

    await repository.save(mission)
    const loaded = await repository.findByMember(memberId(userId))

    expect(loaded).not.toBeNull()
    expect(loaded!.toSnapshot()).toEqual(mission.toSnapshot())
    expect(loaded!.currentCheckpoint.name).toBe('岡崎宿')
  })

  test('他人のIDでは保存できない（RLS）', async () => {
    const admin = adminClient()
    const { client } = await createAuthedMember(admin)
    const repository = new SupabasePersonalMissionRepository(client, TOKAIDO_ROUTE)
    const somebodyElse = PersonalMission.begin(
      memberId('00000000-0000-0000-0000-000000000000'),
      TOKAIDO_ROUTE,
      parseLocalDate('2026-10-01'),
    )

    await expect(repository.save(somebodyElse)).rejects.toThrow()
  })
})
