import { adminClient, createAuthedMember } from '../../../tests/supabaseTestClient.ts'
import { startSmallMission } from '../domain/testHelpers.ts'
import { SupabaseTeamMissionRepository } from './SupabaseTeamMissionRepository.ts'

/**
 * ローカルSupabase CLIに実際に接続する結合テスト（ARCHITECTURE.md「テストの方針」）。
 * `team_mission_state` の楽観的ロック（版番号）は、本物のPostgresでの競合でしか確認できない。
 */
describe('SupabaseTeamMissionRepository（結合テスト）', () => {
  async function repository() {
    const admin = adminClient()
    await admin.from('team_mission_state').delete().eq('id', 1)
    const { client } = await createAuthedMember(admin)
    return new SupabaseTeamMissionRepository(client)
  }

  test('保存がなければミッションはなく、版は0', async () => {
    const repo = await repository()
    const { state, version } = await repo.load()
    expect(state.missions).toEqual([])
    expect(version).toBe(0)
  })

  test('版0での保存（初回）は成功し、以後は版が上がる', async () => {
    const repo = await repository()
    const mission = startSmallMission()

    expect(await repo.save({ missions: [mission] }, 0)).toBe(true)

    const { state, version } = await repo.load()
    expect(version).toBe(1)
    expect(state.missions).toHaveLength(1)
    expect(state.missions[0].toSnapshot()).toEqual(mission.toSnapshot())
  })

  test('版が違うときは保存されず false（楽観的ロック）', async () => {
    const repo = await repository()
    const mission = startSmallMission()
    await repo.save({ missions: [mission] }, 0)

    // すでに版1になっているのに、古い版0のつもりで保存しようとする（他クライアントに負けた想定）
    const ok = await repo.save({ missions: [mission] }, 0)

    expect(ok).toBe(false)
    expect((await repo.load()).version).toBe(1)
  })

  test('正しい版での保存は成功し、2件目のミッションを追加できる', async () => {
    const repo = await repository()
    const mission1 = startSmallMission()
    await repo.save({ missions: [mission1] }, 0)
    const { version } = await repo.load()

    const mission2 = startSmallMission()
    const ok = await repo.save({ missions: [mission1, mission2] }, version)

    expect(ok).toBe(true)
    const { state, version: nextVersion } = await repo.load()
    expect(state.missions).toHaveLength(2)
    expect(nextVersion).toBe(version + 1)
  })

  test('二重初回作成（版0と版0）は、片方だけ成功する', async () => {
    const repo = await repository()
    const missionA = startSmallMission()
    const missionB = startSmallMission()

    const results = await Promise.all([
      repo.save({ missions: [missionA] }, 0),
      repo.save({ missions: [missionB] }, 0),
    ])

    expect(results.filter(Boolean)).toHaveLength(1)
  })
})
