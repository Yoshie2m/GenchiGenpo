import { adminClient, createAuthedMember } from '../../../tests/supabaseTestClient.ts'
import { memberId } from '../../publishedLanguage/memberId.ts'
import { parseLocalDate } from '../../shared/LocalDate.ts'
import { DailySteps } from '../domain/DailySteps.ts'
import { SupabaseDailyStepsRepository } from './SupabaseDailyStepsRepository.ts'

/**
 * ローカルSupabase CLIに実際に接続する結合テスト（ARCHITECTURE.md「テストの方針」）。
 * `daily_steps` の条件付きUPSERT（日次上書きルール）・CHECK制約・RLSは、
 * 本物のPostgresでしか確認できないため、ここで確かめる。
 */
describe('SupabaseDailyStepsRepository（結合テスト）', () => {
  async function setup() {
    const admin = adminClient()
    const { client, userId } = await createAuthedMember(admin)
    await admin
      .from('members')
      .insert({ id: userId, display_name: 'テスト太郎', registered_date: '2026-10-01' })
    return {
      repository: new SupabaseDailyStepsRepository(client),
      client,
      member: memberId(userId),
    }
  }

  test('保存がなければ null・空', async () => {
    const { repository, member } = await setup()
    expect(await repository.findOne(member, parseLocalDate('2026-10-04'))).toBeNull()
    expect(await repository.findByMember(member)).toEqual([])
  })

  test('guard付きの保存を読み戻せ、findByDate でもその日の全員分が読める', async () => {
    const { repository, member } = await setup()
    const date = parseLocalDate('2026-10-04')
    const record = DailySteps.reconstruct(member, date, 8432, 'manual', new Date())

    await repository.save(record, true)

    expect((await repository.findOne(member, date))!.steps).toBe(8432)
    expect((await repository.findByDate(date)).map((r) => r.memberId)).toContain(member)
  })

  test('guard付きの保存は、今より小さい値では上書きしない（日次上書きルール）', async () => {
    const { repository, member } = await setup()
    const date = parseLocalDate('2026-10-04')
    await repository.save(DailySteps.reconstruct(member, date, 8000, 'manual', new Date()), true)

    await repository.save(DailySteps.reconstruct(member, date, 5000, 'manual', new Date()), true)

    expect((await repository.findOne(member, date))!.steps).toBe(8000)
  })

  test('guardなしの保存は、今より小さい値でも上書きする（誤入力の修正）', async () => {
    const { repository, member } = await setup()
    const date = parseLocalDate('2026-10-04')
    await repository.save(DailySteps.reconstruct(member, date, 8000, 'manual', new Date()), true)

    await repository.save(DailySteps.reconstruct(member, date, 5000, 'manual', new Date()), false)

    expect((await repository.findOne(member, date))!.steps).toBe(5000)
  })

  test('findByMember に range を渡すと、その期間だけに絞られる', async () => {
    const { repository, member } = await setup()
    await repository.save(
      DailySteps.reconstruct(member, parseLocalDate('2026-10-01'), 1000, 'manual', new Date()),
      true,
    )
    await repository.save(
      DailySteps.reconstruct(member, parseLocalDate('2026-10-05'), 2000, 'manual', new Date()),
      true,
    )

    const records = await repository.findByMember(member, {
      from: parseLocalDate('2026-10-03'),
      until: parseLocalDate('2026-10-10'),
    })

    expect(records.map((r) => r.date)).toEqual(['2026-10-05'])
  })

  test('1日の歩数は30,000歩が上限（CHECK制約）', async () => {
    const { client, member } = await setup()
    const { error } = await client.from('daily_steps').insert({
      member_id: member,
      date: '2026-10-04',
      steps: 99999,
      source: 'manual',
      reflected_at: new Date().toISOString(),
    })
    expect(error).not.toBeNull()
  })

  test('他人のIDでは保存できない（RLS）', async () => {
    const { repository } = await setup()
    const somebodyElse = DailySteps.reconstruct(
      memberId('00000000-0000-0000-0000-000000000000'),
      parseLocalDate('2026-10-04'),
      1000,
      'manual',
      new Date(),
    )

    await expect(repository.save(somebodyElse, true)).rejects.toThrow()
  })
})
