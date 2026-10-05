import { createApp } from './composition.ts'
import { memberId } from './publishedLanguage/memberId.ts'
import { fixedClock } from './shared/Clock.ts'
import { sequentialIdGenerator } from './shared/IdGenerator.ts'
import { parseLocalDate } from './shared/LocalDate.ts'

/** 日本時間 2026-10-04 12:00 から始める。 */
async function setup() {
  localStorage.clear()
  const app = createApp({
    storage: localStorage,
    baseClock: fixedClock(new Date('2026-10-04T03:00:00Z')),
    ids: sequentialIdGenerator('id'),
  })
  await app.dev.seedDemoIfEmpty()
  return app
}

const today = parseLocalDate('2026-10-04')
const d01 = memberId('demo-01')

describe('歩数を記録すると、個人ミッションとチームミッションに届く', () => {
  test('記録した歩数が道中の累計歩数に入る', async () => {
    const app = await setup()
    const before = (await app.personal.view(d01))!.cumulativeSteps
    await app.steps.recordSteps(d01, today, 9000, 'manual')
    expect((await app.personal.view(d01))!.cumulativeSteps).toBe(before + 9000)
  })

  test('30,000 歩を超えた日は 30,000 歩で記録し、止めたことを返す', async () => {
    const app = await setup()
    expect(await app.steps.recordSteps(d01, today, 42000, 'manual')).toMatchObject({
      steps: 30000,
      capped: true,
    })
  })
})

describe('チームミッションの流れ', () => {
  test('ミッションがなければ候補を出し、最初のミッションは誰でも作成でき、翌日に始まる', async () => {
    const app = await setup()
    const view = await app.team.view(d01)
    expect(view.kind).toBe('none')
    const mission = await app.team.createMission(d01, 'hamaki')
    expect(mission.startDate).toBe('2026-10-05')
    expect(await app.team.view(d01)).toMatchObject({ kind: 'mission', status: 'notStarted' })
    // 使った候補は一番下に回る
    expect((await app.candidates.list()).at(-1)?.candidateId).toBe('hamaki')
  })

  test('開始日の 0:00 になると、全員を2隊に振り分ける（人数の差は最大1人）', async () => {
    const app = await setup()
    await app.team.createMission(d01, 'hamaki')
    await app.dev.advanceHours(12) // 日本時間 10/5 0:00
    const view = await app.team.view(d01)
    if (view.kind !== 'mission') throw new Error('ミッションがありません')
    expect(view.status).toBe('inProgress')
    expect(view.teams.map((t) => t.memberCount)).toEqual([5, 5])
    expect(view.myTeam).not.toBeNull()
  })

  test('開始後に登録したメンバーは、人数の少ない隊に途中参加する', async () => {
    const app = await setup()
    await app.team.createMission(d01, 'hamaki')
    await app.dev.advanceHours(12)
    const late = await app.registerMember('新人')
    const view = await app.team.view(late.id)
    if (view.kind !== 'mission') throw new Error('ミッションがありません')
    expect(view.myTeam).toBe(1)
    expect(view.teams.map((t) => t.memberCount)).toEqual([6, 5])
  })

  test('記録した歩数で進行歩数が増え、今日の上位2名に入ったかがわかる', async () => {
    const app = await setup()
    await app.team.createMission(d01, 'hamaki')
    await app.dev.advanceHours(12)
    await app.steps.recordSteps(d01, parseLocalDate('2026-10-05'), 25000, 'manual')
    const view = await app.team.view(d01)
    if (view.kind !== 'mission') throw new Error('ミッションがありません')
    const mine = view.teams.find((t) => t.team === view.myTeam)!
    expect(mine.standing.progressSteps).toBe(25000)
    expect(view.myTopTwoToday).toBe(true)
  })

  test('期限まで誰も到達しなければ期限で終わり、順位確定の翌日 0:00 に一番上の候補で次が始まる', async () => {
    const app = await setup()
    await app.team.createMission(d01, 'hamaki') // 10/5〜10/15（11日）
    await app.dev.advanceDays(12) // 10/16 12:00（順位は 10/16 13:00 に確定）
    expect(await app.team.view(d01)).toMatchObject({ status: 'accepting' })
    await app.dev.advanceHours(1)
    const finalized = await app.team.view(d01)
    if (finalized.kind !== 'mission') throw new Error('ミッションがありません')
    expect(finalized.status).toBe('finalized')
    expect(finalized.winners).toHaveLength(2) // 誰も歩かなければ同率1位
    expect(finalized.next?.startDate).toBe('2026-10-17')
    await app.dev.advanceHours(11) // 10/17 0:00
    const next = await app.team.view(d01)
    if (next.kind !== 'mission') throw new Error('ミッションがありません')
    expect(next.plan.candidateId).toBe('shokuho')
    expect(next.status).toBe('inProgress')
  })

  test('次のミッションを作成できるのは、前回の優勝チームのメンバーだけ', async () => {
    const app = await setup()
    await app.team.createMission(d01, 'hamaki')
    await app.dev.advanceHours(12)
    const view = await app.team.view(d01)
    if (view.kind !== 'mission') throw new Error('ミッションがありません')
    // 自分の隊だけが歩いて優勝する
    for (let day = 5; day <= 7; day++) {
      await app.steps.recordSteps(d01, parseLocalDate(`2026-10-0${day}`), 30000, 'manual')
      await app.dev.advanceDays(1)
    }
    // 10/8 0:00 → 期限（10/15）の翌日 10/16 13:00 に最終順位が確定する
    await app.dev.advanceDays(8)
    await app.dev.advanceHours(13)
    const finalized = await app.team.view(d01)
    if (finalized.kind !== 'mission') throw new Error('ミッションがありません')
    expect(finalized.status).toBe('finalized')
    expect(finalized.winners).toEqual([view.myTeam])
    expect(finalized.next?.canCreate).toBe(true)
    const otherTeam = view.myTeam === 1 ? 2 : 1
    const other = (await app.team.current())!.membersOf(otherTeam)[0]
    const otherView = await app.team.view(other)
    if (otherView.kind !== 'mission') throw new Error('ミッションがありません')
    expect(otherView.next?.canCreate).toBe(false)
    await expect(app.team.createMission(other, 'irin')).rejects.toThrow()
    // 優勝チームのメンバーは作成でき、次のミッションは翌日に始まる
    const next = await app.team.createMission(d01, 'irin')
    expect(next.startDate).toBe(finalized.next?.startDate)
  })
})
